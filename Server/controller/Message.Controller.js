import  cloudinary  from "../configs/cloudniary.js";
import Conversation from "../models/Conversation.js";
import GUser from "../models/google.model.js";
import Message from "../models/Message.js";
import {io,userSocketMap}  from '../server.js'

const asId = (value) => value?.toString();

const conversationPayload = (conversation, currentUserId) => {
    const currentId = asId(currentUserId);
    const otherMember = conversation.type === "direct"
        ? conversation.members.find((member) => asId(member._id) !== currentId)
        : null;

    return {
        _id: conversation._id,
        type: conversation.type,
        fullName: conversation.type === "group" ? conversation.name : otherMember?.name,
        name: conversation.name,
        email: otherMember?.email,
        bio: conversation.type === "group"
            ? `${conversation.members.length} members`
            : otherMember?.bio,
        profilePic: conversation.type === "group" ? conversation.image : otherMember?.image,
        image: conversation.type === "group" ? conversation.image : otherMember?.image,
        members: conversation.members,
        admins: conversation.admins,
        lastMessage: conversation.lastMessage,
        isFavorite: conversation.favoriteBy.some((id) => asId(id) === currentId),
        isBlocked: conversation.blockedBy.some((id) => asId(id) === currentId),
        blockedBy: conversation.blockedBy,
    };
};

const findOrCreateDirectConversation = async (currentUserId, otherUserId) => {
    let conversation = await Conversation.findOne({
        type: "direct",
        members: { $all: [currentUserId, otherUserId] },
    });

    if (!conversation) {
        conversation = await Conversation.create({
            type: "direct",
            members: [currentUserId, otherUserId],
        });
    }

    return conversation.populate("members", "name email image bio");
};

const emitToConversationMembers = (conversation, eventName, payload, exceptUserId) => {
    conversation.members.forEach((member) => {
        const memberId = asId(member._id || member);
        if (exceptUserId && memberId === asId(exceptUserId)) return;
        const socketId = userSocketMap[memberId];
        if (socketId) io.to(socketId).emit(eventName, payload);
    });
};

const emitConversationUpdate = (conversation) => {
    conversation.members.forEach((member) => {
        const memberId = asId(member._id || member);
        const socketId = userSocketMap[memberId];
        if (socketId) io.to(socketId).emit("conversationUpdated", conversationPayload(conversation, memberId));
    });
};

export const getUserForSidebar = async (req,res)=>{
    try {
        const userId = req.user._id;
        const filteredUsers = await GUser.find({_id:{$ne:userId}}).select("-password")
        const conversations = await Conversation.find({ members: userId })
            .populate("members", "name email image bio")
            .populate("lastMessage")
            .sort({ updatedAt: -1 });
        const unseenMessages = {}
        const promises = conversations.map(async (conversation)=>{
           const messages = await Message.find({
            conversationId: conversation._id,
            senderId: {$ne:userId},
            seenBy: {$ne:userId},
           })
           if(messages.length >0){
            unseenMessages[conversation._id] = messages.length
           }
        })
        await Promise.all(promises)
        res.json({
            success:true,
            users:filteredUsers,
            conversations: conversations.map((conversation) => conversationPayload(conversation, userId)),
            unseenMessages
        })
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message: error.message})
    }
}

export const createDirectConversation = async (req,res)=>{
    try {
        const { userId } = req.body;
        if(!userId) return res.status(400).json({success:false,message:"User id is required"})
        const conversation = await findOrCreateDirectConversation(req.user._id,userId)
        res.json({success:true,conversation:conversationPayload(conversation,req.user._id)})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}

export const createGroupConversation = async (req,res)=>{
    try {
        const { name, members = [], image = "" } = req.body;
        const uniqueMembers = [...new Set([asId(req.user._id), ...members.map(asId)])].filter(Boolean);
        if(!name?.trim()) return res.status(400).json({success:false,message:"Group name is required"})
        if(uniqueMembers.length < 2) return res.status(400).json({success:false,message:"Select at least one member"})
        const conversation = await Conversation.create({
            type:"group",
            name:name.trim(),
            image,
            members:uniqueMembers,
            admins:[req.user._id],
        })
        await conversation.populate("members", "name email image bio")
        emitConversationUpdate(conversation)
        res.status(201).json({success:true,conversation:conversationPayload(conversation,req.user._id)})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}

export const getMessages = async (req,res) =>{
    try {
        const {id:conversationId} = req.params
        const myId = req.user._id;
        const conversation = await Conversation.findOne({_id:conversationId,members:myId})
        if(!conversation) return res.status(404).json({success:false,message:"Conversation not found"})
        const messages = await Message.find({conversationId}).sort({createdAt:1})
        await Message.updateMany(
            {conversationId,senderId:{$ne:myId},seenBy:{$ne:myId}},
            {$addToSet:{seenBy:myId},seen:true}
        )
        res.json({success:true,messages})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message: error.message})
    }
}

export const markMessageAsSeen = async(req,res)=>{
    try {
        const {id} = req.params
        await Message.findByIdAndUpdate(id,{$addToSet:{seenBy:req.user._id},seen:true})
        res.json({success:true})
    } catch (error) {
         console.log(error.message)
        res.json({success:false,message: error.message})
    }
}

export const sendMessage = async (req,res) =>{
    try {
        const {text,image} = req.body;
        const conversationId = req.params.id;
        const senderId = req.user._id;   
        const conversation = await Conversation.findOne({_id:conversationId,members:senderId}).populate("members", "name email image bio");
        if(!conversation) return res.status(404).json({success:false,message:"Conversation not found"})
        if(conversation.blockedBy.length) {
            return res.status(403).json({success:false,message:"This chat is blocked"})
        }

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }
        const newMessage = await Message.create({
            conversationId,senderId,text,image:imageUrl,seenBy:[senderId]
        })
        conversation.lastMessage = newMessage._id;
        await conversation.save();

        emitToConversationMembers(conversation, "newMessage", newMessage, senderId)
        emitConversationUpdate({
            ...conversation.toObject(),
            members: conversation.members,
            lastMessage: newMessage,
        })

        res.json({success:true,newMessage})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message: error.message})
    }
}

export const toggleFavoriteConversation = async (req,res)=>{
    try {
        const conversation = await Conversation.findOne({_id:req.params.id,members:req.user._id}).populate("members", "name email image bio").populate("lastMessage")
        if(!conversation) return res.status(404).json({success:false,message:"Conversation not found"})
        const isFavorite = conversation.favoriteBy.some((id)=>asId(id)===asId(req.user._id))
        conversation.favoriteBy = isFavorite
            ? conversation.favoriteBy.filter((id)=>asId(id)!==asId(req.user._id))
            : [...conversation.favoriteBy, req.user._id]
        await conversation.save()
        res.json({success:true,conversation:conversationPayload(conversation,req.user._id)})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

export const toggleBlockConversation = async (req,res)=>{
    try {
        const conversation = await Conversation.findOne({_id:req.params.id,members:req.user._id}).populate("members", "name email image bio").populate("lastMessage")
        if(!conversation) return res.status(404).json({success:false,message:"Conversation not found"})
        const isBlocked = conversation.blockedBy.some((id)=>asId(id)===asId(req.user._id))
        conversation.blockedBy = isBlocked
            ? conversation.blockedBy.filter((id)=>asId(id)!==asId(req.user._id))
            : [...conversation.blockedBy, req.user._id]
        await conversation.save()
        emitConversationUpdate(conversation)
        res.json({success:true,conversation:conversationPayload(conversation,req.user._id)})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

export const removeGroupMember = async (req,res)=>{
    try {
        const { memberId } = req.params;
        const conversation = await Conversation.findOne({_id:req.params.id,type:"group",members:req.user._id}).populate("members", "name email image bio")
        if(!conversation) return res.status(404).json({success:false,message:"Group not found"})
        if(!conversation.admins.some((id)=>asId(id)===asId(req.user._id))) {
            return res.status(403).json({success:false,message:"Only group admin can remove members"})
        }
        conversation.members = conversation.members.filter((member)=>asId(member._id)!==asId(memberId))
        conversation.admins = conversation.admins.filter((id)=>asId(id)!==asId(memberId))
        await conversation.save()
        await conversation.populate("members", "name email image bio")
        emitConversationUpdate(conversation)
        const removedSocketId = userSocketMap[memberId]
        if(removedSocketId) io.to(removedSocketId).emit("conversationDeleted", req.params.id)
        res.json({success:true,conversation:conversationPayload(conversation,req.user._id)})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

export const deleteGroupConversation = async (req,res)=>{
    try {
        const conversation = await Conversation.findOne({_id:req.params.id,type:"group",members:req.user._id})
        if(!conversation) return res.status(404).json({success:false,message:"Group not found"})
        if(!conversation.admins.some((id)=>asId(id)===asId(req.user._id))) {
            return res.status(403).json({success:false,message:"Only group admin can delete this group"})
        }
        const members = conversation.members.map(asId)
        await Message.deleteMany({conversationId:conversation._id})
        await Conversation.deleteOne({_id:conversation._id})
        members.forEach((memberId)=>{
            const socketId = userSocketMap[memberId]
            if(socketId) io.to(socketId).emit("conversationDeleted", asId(conversation._id))
        })
        res.json({success:true})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}
