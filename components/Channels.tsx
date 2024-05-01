"use client";
import { useEffect, useState } from "react";
import { auth } from "../app/config"; 
import { getDatabase, ref, onValue ,get,child,push,set} from 'firebase/database';
import Channel from './Channel';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Channels({ setSelectedChannel }) {
    const [channels, setChannels] = useState([]);
    const [username, setUsername] = useState('');
    const [userAvatar, setUserAvatar] = useState({
        url: '',
        alt: '',
    });

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const database = getDatabase();
            const userRef = ref(database, 'users/' + user.uid);
            const encodedEmail = encodeEmail(user.email);
            const avatarRef = ref(database, `avatars/${encodedEmail}`);

            get(userRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    setUsername(userData.userName);
                }
            });

            get(avatarRef).then((snapshot) => {
                if (snapshot.exists() && snapshot.val().fileName) {
                    const fileName = snapshot.val().fileName;
                    const storage = getStorage();
                    const StorageRef = storageRef(storage, `avatars/${encodedEmail}/${fileName}`);

                    getDownloadURL(StorageRef).then((url) => {
                        setUserAvatar({
                            url: url,
                            alt: `Avatar for ${user.email}`
                        });
                    }).catch(error => {
                        console.error('Error fetching download URL:', error);
                    });
                }
            }).catch(error => {
                console.error('Error fetching avatar data:', error);
            });

            // Fetch channels
            const channelsRef = ref(database, 'users/' + user.uid + '/channels');
            const unsubscribe = onValue(channelsRef, (snapshot) => {
                const channels = [];
                snapshot.forEach((childSnapshot) => {
                    channels.push({
                        id: childSnapshot.key,
                        name: childSnapshot.val().name
                    });
                });
                setChannels(channels);
            });

            return () => unsubscribe();
        } else {
            console.log('User not authenticated');
        }
    }, [auth.currentUser]);
    

    function encodeEmail(email:string) {
        return email.replace(/\./g, ',');
    }

    const handleAddChannel = () => {
        const newChannelName = prompt('Enter channel name');
        if (newChannelName) {
            const user = auth.currentUser;
            if (user) {
                addChannel(user, newChannelName)
                    .then(() => {
                        fetchChannels(user)
                            .then(channelList => setChannels(channelList))
                            .catch(error => console.log("Error fetching channels:", error));
                    })
                    .catch(error => console.log("Error adding channel:", error));
            } else {
                console.log('User not authenticated');
            }
        }
    };


    async function addChannel(user:any, newChannelName:any) {
        try {
            const database = getDatabase();
            const userRef = ref(database, 'users');
            const userSnapshot = await get(child(userRef, user.uid));
            const chatsRef = ref(database, 'chats');
    
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                const newChannelRef = push(child(userRef, `${user.uid}/channels`));
                await set(newChannelRef, { name: newChannelName });
                await set(child(chatsRef, newChannelRef.key), {
                    channelName: newChannelName,
                    email: user.email,
                });
    
                console.log('Channel added successfully.');
            } else {
                console.log('User not found.');
            }
        } catch (error) {
            console.error("Error adding channel:", error);
            throw error;
        }
    }


    const handleChannelClick = (channel:any) => {
        setSelectedChannel(channel); // Update selected channel
    };

    const handleUploadProfile = (e:any) => {    
        if (!e.target.files.length) return;
        const file = e.target.files[0];
        const user = auth.currentUser;
        if (!user) return console.error("No user logged in");
        
        const encodedEmail = encodeEmail(user.email);
        const StorageRef = storageRef(getStorage(), `avatars/${encodedEmail}/${file.name}`);
        const avatarRef = ref(getDatabase(), `avatars/${encodedEmail}`);
    
        set(avatarRef, {fileName: file.name}).then(() => {
            console.log('Avatar metadata added successfully.');
        }).catch(error => {
            console.error("Error adding avatar metadata:", error);
        });
        
        uploadBytes(StorageRef, file).then((snapshot) => {
            getDownloadURL(snapshot.ref).then((downloadURL) => {
                setUserAvatar({
                    url: downloadURL,
                    alt: `Avatar for ${user.email}`
                });
                console.log("Avatar uploaded and URL set in state");
            }).catch(error => {
                console.error('Error fetching download URL:', error);
            });
        }).catch((error) => {
            console.error('Error uploading image:', error);
        });
    };
    

    return (
        <div className="hidden lg:block border-r bg-gray-100/40 dark:bg-gray-800/40">
            <div className="flex h-full max-h-screen flex-col p-4">
                <div className="flex items-center justify-between mb-4"> {/* Add margin-bottom */}
                    <h3 className="text-lg font-semibold">Channels</h3>
                    <div className="flex items-center space-x-3"> {/* Increased space between buttons */}
                        <button className="btn-icon" onClick={handleAddChannel}>
                            <PlusIcon className="h-4 w-4" />
                        </button>
                        <label className="cursor-pointer rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600">
                            <UploadCloudIcon className="h-4 w-4 inline-block" />
                            <input type="file" className="hidden" onChange={handleUploadProfile} accept="image/*" />
                        </label>
                    </div>
                </div>
                <div className="flex items-center space-x-3 rounded-md px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-800 mb-4"> {/* Add margin-bottom */}
                    <Avatar className="h-12 w-12">
                        <AvatarImage alt={`Avatar for ${auth.currentUser?.email}`} src={userAvatar.url || "/placeholder-avatar.jpg"} />
                        <AvatarFallback>{auth.currentUser?.email?.slice(0, auth.currentUser.email.indexOf("@")).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                        <p className="text-sm font-medium">{username}</p>
                        <p className="text-xs font-medium">{auth.currentUser?.email}</p>
                    </div>
                    
                </div>
                <hr className="my-4 border-t border-gray-200 dark:border-gray-700"/>
                <div className="flex-1 overflow-y-auto">
                    <div className="grid gap-2">
                        {channels.map(channel => (
                            <Channel
                                key={channel.id}
                                avatarAlt={`@${channel.name}`}
                                avatarSrc="/placeholder-avatar.jpg"
                                avatarFallback={channel.name.slice(0, 2).toUpperCase()}
                                channelName={channel.name}
                                onClick={() => handleChannelClick(channel)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
    
    
}




function PlusIcon(props:any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}


function UploadCloudIcon(props:any) {
    return (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <path d="M12 12v9" />
        <path d="m16 16-4-4-4 4" />
    </svg>
)}