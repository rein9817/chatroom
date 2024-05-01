import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { getDatabase, ref, get } from "firebase/database";
import { useEffect, useState } from "react";

const encodeEmail = email => email.replace(/\./g, ',');

export default function Message({ avatarAlt, avatarFallback, senderName, messageContent, currentUser, imageUrl }) {
    const isCurrentUser = senderName === currentUser;
    const [avatarSrc, setAvatarSrc] = useState("/placeholder-avatar.jpg"); // Default or low-res placeholder
    const database = getDatabase();

    useEffect(() => {
        const encodedEmail = encodeEmail(senderName);
        const avatarRef = ref(database, `avatars/${encodedEmail}`);

        get(avatarRef).then((snapshot) => {
            if (snapshot.exists() && snapshot.val().fileName) {
                const fileName = snapshot.val().fileName;
                const storage = getStorage();
                const StorageRef = storageRef(storage, `avatars/${encodedEmail}/${fileName}`);

                getDownloadURL(StorageRef).then((url) => {
                    // Check if URL is already in localStorage and is different from the current state
                    const cachedUrl = localStorage.getItem(url);
                    if (cachedUrl && cachedUrl !== avatarSrc) {
                        setAvatarSrc(cachedUrl);
                    } else if (!cachedUrl) {
                        setAvatarSrc(url);
                        localStorage.setItem(url, url);  // Cache URL in localStorage
                    }
                }).catch(error => {
                    console.error('Error fetching download URL:', error);
                });
            }
        }).catch(error => {
            console.error('Error fetching avatar data:', error);
        });
    }, [senderName, avatarSrc]);

    return (
        <div className={`flex items-start gap-2 p-4 ${isCurrentUser ? 'justify-end' : ''}`}>
            {!isCurrentUser && (
                <Avatar>
                    <AvatarImage alt={avatarAlt} src={avatarSrc} />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
            )}
            <div className={`max-w-[80%] rounded-md p-3 text-sm ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {messageContent && !imageUrl && <p>{messageContent}</p>}
                {imageUrl && (
                    <div className="relative w-full max-w-md">
                        <Image src={imageUrl} alt="Attached Image" layout="responsive" width={300} height={300} objectFit="cover"/>
                    </div>
                )}
            </div>
            {isCurrentUser && (
                <Avatar>
                    <AvatarImage alt={avatarAlt} src={avatarSrc} />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}
