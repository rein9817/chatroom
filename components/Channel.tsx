import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";

export default function Channel({ avatarAlt, avatarSrc, avatarFallback, channelName, onClick }) {
    return (
        <div className="flex items-center gap-3 rounded-md bg-gray-100 p-2 dark:bg-gray-800 hover:bg-gray-200 focus:bg-gray-300" onClick={onClick}>
            <Avatar>
                <AvatarImage alt={avatarAlt} src={avatarSrc} />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="font-medium">{channelName}</div>
            </div>
        </div>
    );
}




