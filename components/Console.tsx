"use client";
import { useEffect, useState, useRef, use } from "react";
import { auth, db } from "../app/config";
import Message from "./Message";
import { signOut } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"
import { getDatabase, ref, get, push, update ,child, set, onChildAdded,onValue} from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Console({ selectedChannel }) {
    const [content, setContent] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const inputRef = useRef(null);
    const gotoBottom = useRef(null);
    const initialLoad=useRef(new Date().getTime());
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [blockListLoaded, setBlockListLoaded] = useState(false);

    const [file, setFile] = useState({
        url: "",
        name: null
    });

    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setCurrentUser(user.email);
            } else {
                setCurrentUser(null);
                setBlockedUsers([]);
                setMessages([]);
            }
        });
    
        return () => unsubscribeAuth();
    }, []);
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (blockListLoaded && selectedChannel && selectedChannel.id) {
            // Now load messages because block list is loaded
            // Existing message fetching logic here...
            setMessages([]);
    
            const messagesRef = ref(db, `messages/${selectedChannel.id}`);
            const blockListRef = ref(db, `blocks/${encodeEmail(currentUser)}`);
        
            // 监听封锁名单的变化
            const unsubscribeBlocks = onValue(blockListRef, (snapshot) => {
                const newBlockedUsers = [];
                snapshot.forEach(childSnapshot => {
                    newBlockedUsers.push(childSnapshot.val().blocker);
                });
                setBlockedUsers(newBlockedUsers);
            }, error => {
                console.error("Failed to fetch block list:", error);
            });
        
            // 监听新消息
            const unsubscribeMessages = onChildAdded(messagesRef, (snapshot) => {
                const newMessage = snapshot.val();
                if (!blockedUsers.includes(newMessage.sender)) {
                    setMessages(prevMessages => [...prevMessages, newMessage]);
                }
            }, error => {
                console.error("Failed to subscribe to messages:", error);
            });
        
            return () => {
                unsubscribeBlocks();
                unsubscribeMessages();
            };
        }
    }, [blockListLoaded, selectedChannel]);

    
    // useEffect(() => {
    //     if (!selectedChannel || !selectedChannel.id || !currentUser) {
    //         return;
    //     }
        
    //     // 清空消息以准备新的频道数据
       
    // }, [selectedChannel, db, currentUser]);
    
    useEffect(() => {
        if (!currentUser) {
            console.log('Current user is not defined.');
            return;
        }
    
        const blockListRef = ref(db, `blocks/${encodeEmail(currentUser)}`);
    
        const unsubscribeBlocks = onValue(blockListRef, (snapshot) => {
            const newBlockedUsers = [];
            snapshot.forEach(childSnapshot => {
                newBlockedUsers.push(childSnapshot.val().blocker);
            });
            setBlockedUsers(newBlockedUsers);
            setBlockListLoaded(true); // 设置封锁列表已加载
        }, error => {
            console.error("Failed to fetch block list:", error);
        });
    
        return () => {
            unsubscribeBlocks();
            setBlockListLoaded(false); // 重置封锁列表加载状态
        };
    }, [currentUser]);
    
    

    // 过滤封锁用户的消息
    useEffect(() => {
        setMessages(prevMessages => prevMessages.filter(message => !blockedUsers.includes(message.sender)));
    }, [blockedUsers]);
    
    
    
    

    

    const scrollToBottom = () => {
        gotoBottom.current.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async (selectedChannel) => {
        if (!selectedChannel || !selectedChannel.id) {
            return;
        }
        try {
            const messagesRef = ref(db, `messages/${selectedChannel.id}`);
            const snapshot = await get(messagesRef);
            const messagesData = snapshot.val();
    
            if (messagesData && typeof messagesData === 'object') {
                const messagesArray = Object.values(messagesData).map(message => {
                    return { ...message }; 
                });
                setMessages(messagesArray);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleSend = () => {
        const user = auth.currentUser;
    
        if (!content.trim() && !file.url) {
            return;
        }        
    
        const post_data = {
            content: content, 
            timestamp: new Date().getTime(),
            sender: user.email,
            fileUrl: file.url ? file.url : "" 
        };
    
        const messagesRef = ref(db, `messages/${selectedChannel.id}`);
    
        push(messagesRef, post_data)
            .then(() => {
                fetchMessages(selectedChannel);
                setContent(''); 
                setFile({      
                    url: "",
                    name: null
                });
            })
            .catch((error) => {
                console.error('Error sending message:', error);
            });
    
        setTimeout(() => {
            setContent('');
            inputRef.current.value = '';
        }, 100);
    };

    const handleAddUser = async () => {
        try {
            const userEmail = window.prompt('Enter user email');
            if (!userEmail || !selectedChannel || !selectedChannel.id) {
                return;
            }

            const user = auth.currentUser;
            const usersRef = ref(db, 'users/');
            const userSnapshot = await get(usersRef);
            let targetUserId = null;

            userSnapshot.forEach((childSnapshot) => {
                const email = childSnapshot.val().email;
                if (email === userEmail) {
                    targetUserId = childSnapshot.key;
                }
            });

            if (!targetUserId) {
                console.error('User not found with email:', userEmail);
                return;
            }

            const anotherRef = ref(db, `users/${targetUserId}/channels/${selectedChannel.id}`);
            update(anotherRef, { name: selectedChannel.name });

            const chatsRef = ref(db, 'chats');
            await update(child(chatsRef, selectedChannel.id, 'emails'), {
                [user.uid]: user.email,
            });

            fetchMessages(selectedChannel);
            enqueueSnackbar("Adding user successfully", { 
                anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'right',
                },
                variant: 'success'
            });

        } catch (error) {
            enqueueSnackbar("Adding user failed", { 
                anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'right',
                },
                variant: 'error'
            });
        }
    };

    const handleLogout = () => {
        signOut(auth).then(() => {
            enqueueSnackbar("User logout successfully", { 
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'center',
                },
                variant: 'success',
            });
            navigate('/');
        }).catch((error) => {
            enqueueSnackbar("User create failed", { 
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'center',
                },
                variant: 'error'
            });
        });
    };


    

    const handleUploadImage = (file:any) => {
        if (!file) {
            return;
        }
    
        console.log(file);
    
        const storage = getStorage();
        const user = auth.currentUser;
        const encodedEmail = encodeEmail(user.email);
        const StorageRef = storageRef(storage, `users/${encodedEmail}/${file.name}`);
    
        let post_data = {
            content: "",
            timestamp: new Date().getTime(),
            sender: user.email,
            fileUrl: "" 
        };
    
        uploadBytes(StorageRef, file)
            .then((snapshot) => {
                console.log("Success uploading image");
    
                return getDownloadURL(snapshot.ref); // Return this promise to chain it
            })
            .then((downloadURL) => {
                console.log("Success fetching download URL");
                post_data.fileUrl = downloadURL; // Set file URL after successful fetching
    
                const messagesRef = ref(db, `messages/${selectedChannel.id}`);
                console.log(downloadURL);
                // Now push post_data inside this then block
                return push(messagesRef, post_data);
            })
            .then(() => {
                console.log("Message posted with file URL");
                fetchMessages(selectedChannel); // Update messages list state
                setContent(''); // Clear input field content
                setFile({ // Reset file state
                    url: "",
                    name: null
                });
            })
            .catch((error) => {
                console.error('Error during image upload or message sending:', error);
            });
    
        setTimeout(() => {
            setContent('');
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }, 100);
    };
    
    
    

    const handleEnter = (e:any) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    function showNotification(message:string) {
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notification");
        } else if (Notification.permission === "granted") {
            new Notification(message);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(function (permission) {
                if (permission === "granted") {
                    new Notification(message);
                }
            });
        }
    }


    const handleBlockUser = () => {
        const blockEmail = prompt("Enter the email of the user you want to block");
        if (!blockEmail || !currentUser) {
            console.error("No block email provided or current user is undefined.");
            return;
        }

        const blockRef = ref(db, `blocks/${encodeEmail(currentUser)}`);
        push(blockRef, { blocker: blockEmail, timestamp: new Date().getTime() })
            .then(() => console.log("User blocked successfully"))
            .catch(error => console.error("Error blocking user:", error));
    };
    


    return (
        <div className="flex flex-col">
            <header className="flex h-14 items-center justify-between border-b bg-gray-100/40 px-4 dark:bg-gray-800/40">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Chatroom</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="destructive" onClick={handleBlockUser}>
                        <BanIcon className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleAddUser}>
                        <UsersIcon className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleLogout}>
                        <LogOutIcon className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-auto">
            {messages.map((message, index) => {
                return (
                        <Message 
                            key={index}
                            avatarAlt={message.sender}
                            avatarFallback={message.sender.slice(0, message.sender.indexOf('@')).toUpperCase()}
                            senderName={message.sender}
                            messageContent={message.content}
                            currentUser={currentUser}
                            imageUrl={message.fileUrl}
                        />
                        );
            })}
    <div ref={gotoBottom}></div>
</main>


            <footer className="border-t bg-gray-100/40 p-4 dark:bg-gray-800/40 sticky bottom-0">
                <div className="flex items-center gap-2">
                    <Input  ref={inputRef} className="flex-1" placeholder="Type your message..." type="text" 
                        onChange={(e)=>{
                            setContent(e.target.value);
                        }}
                        onKeyDown={handleEnter}
                    />
                    
                    <div>
                        <input
                            id="file-input"
                            type="file"
                            onChange={(e:any)=>{
                                handleUploadImage(e.target.files[0]);
                            }}
                            style={{ display: 'none' }}
                        />
                        <Button size="icon" variant="ghost" onClick={() => document.getElementById('file-input').click()}>
                            <PaperclipIcon className="h-5 w-5" />
                        </Button>
                    </div>
                    <Button size="icon" variant="ghost" onClick={handleSend}>
                        <SendIcon className="h-5 w-5" />
                    </Button>
                </div>
            </footer>
        </div>
    );
}

function UsersIcon(props:any) {
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
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
)}

function SendIcon(props:any) {
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
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
        </svg>
    );
}

function LogOutIcon(props:any) {
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
    );
}

function PaperclipIcon(props:any) {
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
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    );
}

function encodeEmail(email:any) {
    if (!email) {
        return '';
    }
    return email.replace(/\./g, ',');
}

function BanIcon(props:any) {
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
        <circle cx="12" cy="12" r="10" />
        <path d="m4.9 4.9 14.2 14.2" />
    </svg>
)}