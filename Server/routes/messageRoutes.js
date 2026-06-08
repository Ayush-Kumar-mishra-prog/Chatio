import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { createDirectConversation, createGroupConversation, deleteGroupConversation, getMessages, getUserForSidebar, markMessageAsSeen, removeGroupMember, sendMessage, toggleBlockConversation, toggleFavoriteConversation } from '../controller/Message.Controller.js'
const messageRouter = express.Router()
messageRouter.get("/users",protect,getUserForSidebar)
messageRouter.post("/conversation/direct",protect,createDirectConversation)
messageRouter.post("/conversation/group",protect,createGroupConversation)
messageRouter.put("/conversation/:id/favorite",protect,toggleFavoriteConversation)
messageRouter.put("/conversation/:id/block",protect,toggleBlockConversation)
messageRouter.delete("/conversation/:id/member/:memberId",protect,removeGroupMember)
messageRouter.delete("/conversation/:id",protect,deleteGroupConversation)
messageRouter.get("/:id",protect,getMessages)
messageRouter.put("/mark/:id",protect,markMessageAsSeen)
messageRouter.post("/send/:id",protect,sendMessage)
export default messageRouter
