export const asId = (value) => (value?._id ?? value)?.toString?.() ?? "";

export function formatMessageTime(date){
    return new Date(date).toLocaleTimeString('en-US',{
        hour:"2-digit",
        minute:"2-digit",
        hour12:false
    })
}