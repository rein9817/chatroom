"use client";
import { useEffect, useState, useRef, use } from "react";
import { auth, db } from "../app/config";
import Message from "./Message";
import { signOut } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"
import { getDatabase, ref, get, push, update ,child, set, onChildAdded} from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Console({ selectedChannel }) {
    const [content, setContent] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const inputRef = useRef(null);
    const gotoBottom = useRef(null);
    const initialLoad=useRef(new Date().getTime());
    
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
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!selectedChannel || !selectedChannel.id) {
            setMessages([]);  // Clear messages if channel is invalid
            return;
        }
    
        setMessages([]);
        console.log(initialLoad.current);
        const messagesRef = ref(db, `messages/${selectedChannel.id}`);
        
        const unsubscribeMessages = onChildAdded(messagesRef, (snapshot) => {
            const newMessage = snapshot.val();
            setMessages(prevMessages => [...prevMessages, newMessage]);  // Update message list
    
            if (newMessage.timestamp > initialLoad.current && newMessage.sender !== currentUser) {
                showNotification(`New message from ${newMessage.sender} in channel ${newMessage.channel}: ${newMessage.content}`);
            }
        });
    
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notifications");
        } else if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    
        return () => unsubscribeMessages();  // Cleanup subscription
    }, [selectedChannel, db, currentUser]);  // Dependencies
    
    
    
    

    

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
                fetchMessages(selectedChannel); // 更新消息列表状态
                setContent(''); // 清空输入框内容
                setFile({      // 清空文件状态
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

    const handleFileChange = (e:any) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            console.log(selectedFile.type);
            if (selectedFile.type.includes('video')) {
                handleUploadVideo(selectedFile);
            } else {
                handleUploadImage(selectedFile);
            }
        }
    };

    const handleUploadVideo = (file:any) => {
        if (!file) {
            return;
        }
    
        const storage = getStorage();
        const user = auth.currentUser;

        const StorageRef = storageRef(storage, `videos/${user.email}/${file.name}`);
        uploadBytes(StorageRef, file)
            .then((snapshot) => {
                console.log("Video uploaded successfully");
                console.log(snapshot);

                setFile({
                    url: snapshot.ref.fullPath,
                    name: file.name
                });
            })
            .catch((error) => {
                console.error('Error uploading video:', error);
            });
        
    };

    const handleUploadImage = (file:any) => {
        if (!file) {
            return;
        }
    
        const storage = getStorage();
        const user = auth.currentUser;
        const StorageRef = storageRef(storage, `users/${user.email}/${file.name}`);
    
        uploadBytes(StorageRef, file)
            .then((snapshot) => {
                console.log("Success uploading image");
                setFile({
                    url: snapshot.ref.fullPath,
                    name: file.name
                });
                const post_data = {
                    content: "", // 消息内容为空
                    timestamp: new Date().getTime(),
                    sender: user.email,
                    fileUrl: snapshot.ref.fullPath // 图片URL设置为fileUrl属性
                };
                const messagesRef = ref(db, `messages/${selectedChannel.id}`);
                push(messagesRef, post_data)
                    .then(() => {
                        fetchMessages(selectedChannel);
                    })
                    .catch((error) => {
                        console.error('Error sending message:', error);
                    });
            })
            .catch((error) => {
                console.error('Error uploading image:', error);
            });
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

    return (
        <div className="flex flex-col">
            <header className="flex h-14 items-center justify-between border-b bg-gray-100/40 px-4 dark:bg-gray-800/40">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Chatroom</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={handleAddUser}>
                        <SendIcon className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleLogout}>
                        <LogOutIcon className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-auto">
                {messages.map((message, index) => (
                    <Message 
                        key={index} 
                        avatarAlt={message.sender} 
                        // avatarSrc={"/placeholder-avatar.jpg"} 
                        avatarFallback={message.sender.slice(0, message.sender.indexOf('@')).toUpperCase()}
                        senderName={message.sender} 
                        messageContent={message.content} 
                        currentUser={currentUser} 
                        imageUrl={message.fileUrl}
                    />
                ))}
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
                            onChange={handleFileChange}
                            style={{ display: 'none' }} // Hide the file input
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

function VideoIcon(props:any) {
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
            <path d="m22 8-6 4 6 4V8Z" />
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
    );
}
