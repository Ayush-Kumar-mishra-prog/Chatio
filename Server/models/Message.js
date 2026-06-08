import mongoose from 'mongoose'

const messageSchema = mongoose.Schema({
    conversationId:{type:mongoose.Schema.Types.ObjectId,ref:"Conversation"},
    senderId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    reciverId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    text:{type:String,},
    image:{type:String, default:""},
    seenBy:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
    seen:{type:Boolean, default:false}
},{timestamps:true})
const Message = mongoose.model("Message",messageSchema)
export default Message
