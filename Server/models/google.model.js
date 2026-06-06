import mongoose from "mongoose";

const gSchema = new mongoose.Schema(
{
  name:{
    type:String,
    
  },
  email:{
    type:String,
    
},
image:{
  type:String
}
}
);

// export default mongoose.model("GoogleUser", gSchema);

const GUser = mongoose.models.User || mongoose.model("User", gSchema);

export default GUser;