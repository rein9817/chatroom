import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react";


export default function Message({ avatarAlt, avatarSrc, avatarFallback, senderName, messageContent, currentUser, fileUrl }) {
    const isCurrentUser = senderName === currentUser;
    const isVideo = fileUrl && fileUrl.endsWith(".mp4");

    const [fileDownloadUrl, setFileDownloadUrl] = useState(null);
    
    useEffect(() => {
        if (fileUrl) {
            const storage = getStorage();
            const fileStorageRef = storageRef(storage, fileUrl);
            getDownloadURL(fileStorageRef)
                .then((url) => {
                    setFileDownloadUrl(url);
                })
                .catch((error) => {
                    console.error("Error getting download URL:", error);
                    // Handle error gracefully, e.g., set a default URL
                    setFileDownloadUrl(null);
                });
        }
    }, [fileUrl]);

    return (
        <div className={`flex items-start gap-2 p-4 ${isCurrentUser ? 'justify-end' : ''}`}>
            {!isCurrentUser && (
                <Avatar>
                    <AvatarImage alt={avatarAlt} src={avatarSrc} />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
            )}
            <div className={`max-w-[80%] rounded-md bg-gray-100 p-3 text-sm dark:bg-gray-800`}>
                {messageContent && !fileUrl && <p>{messageContent}</p>}
                {fileUrl && !isVideo && fileDownloadUrl && (
                    <div className="relative w-48 h-48">
                        <Image src={fileDownloadUrl} alt="Uploaded" layout="fill" objectFit="cover"/>
                    </div>
                )}
                {isVideo && fileDownloadUrl && (
                    <video controls className="w-48 h-48">
                        <source src={fileDownloadUrl} type="video/mp4" />
                    </video>
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
