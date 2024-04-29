'use client'
import Console from "@/components/Console"
import Channels from "@/components/Channels"
import { useState } from "react"

export default function Menu() {
    const [selectedChannel, setSelectedChannel] = useState(null);
    return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <Channels setSelectedChannel={setSelectedChannel}/>
        <Console selectedChannel={selectedChannel} />
    </div> 
)}
