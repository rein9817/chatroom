"use client";
import { useEffect, useState } from "react";
import { auth } from "../app/config"; 
import { getDatabase, ref, onValue ,get,child,push,set} from 'firebase/database';
import Channel from './Channel';

export default function Channels({ setSelectedChannel }) {
    const [channels, setChannels] = useState([]);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const database = getDatabase();
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
    }, []);


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


    const handleChannelClick = (channel) => {
        setSelectedChannel(channel); // Update selected channel
    };

    return (
        <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
            <div className="flex h-full max-h-screen flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Channels</h3>
                    <button className="btn-icon" onClick={handleAddChannel}>
                        <PlusIcon className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-auto">
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