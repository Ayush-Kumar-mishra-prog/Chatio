# Quick Reference: Loading States & Indicators

## Using Loading Context

### In Any Component:

```jsx
import { useLoading } from "../context/LoadingContext";

export const MyComponent = () => {
  const { setLoading, isLoading } = useLoading();

  const handleAction = async () => {
    setLoading("my_action", true);
    try {
      // Do async work
      await someAsyncFunction();
    } finally {
      setLoading("my_action", false);
    }
  };

  return (
    <button onClick={handleAction} disabled={isLoading("my_action")}>
      {isLoading("my_action") ? "Loading..." : "Click me"}
    </button>
  );
};
```

## Using Loading Spinner Component

### Basic Usage:

```jsx
import LoadingSpinner from "../components/LoadingSpinner";

// Standalone spinner
<LoadingSpinner size="md" />

// Inline spinner (inside button)
<button>
  {isLoading ? (
    <>
      <LoadingSpinner size="sm" inline />
      Loading...
    </>
  ) : (
    "Click me"
  )}
</button>
```

### Sizes:

- `sm` - 16px (w-4 h-4)
- `md` - 24px (w-6 h-6) - Default
- `lg` - 32px (w-8 h-8)
- `xl` - 40px (w-10 h-10)

## Loading State Patterns

### Pattern 1: Simple Button Loading

```jsx
const [isLoading, setIsLoading] = useState(false);

const handleClick = async () => {
  setIsLoading(true);
  try {
    await apiCall();
  } finally {
    setIsLoading(false);
  }
};

return (
  <button disabled={isLoading} onClick={handleClick}>
    {isLoading ? <LoadingSpinner size="sm" inline /> : "Submit"}
  </button>
);
```

### Pattern 2: Context-Based Loading (ChatPage Example)

```jsx
const { setLoading, isLoading } = useLoading();

const handleToggleFavorite = async (conversationId) => {
  try {
    setLoading(`favorite_${conversationId}`, true);
    const { data } = await toggleFavoriteChat(conversationId);
    upsertConversation(data.conversation);
    toast.success("Added to favorites");
  } catch (error) {
    toast.error("Failed");
  } finally {
    setLoading(`favorite_${conversationId}`, false);
  }
};

// In RightSidebar
<button disabled={isLoadingFavorite} onClick={() => handleToggleFavorite(id)}>
  {isLoadingFavorite ? <LoadingSpinner size="sm" inline /> : <StarIcon />}
</button>;
```

### Pattern 3: Multiple Async Actions

```jsx
const { setLoading, isLoading } = useLoading();

const actions = {
  save: `save_${id}`,
  delete: `delete_${id}`,
  export: `export_${id}`,
};

const handleSave = async () => {
  setLoading(actions.save, true);
  try {
    /* ... */
  } finally {
    setLoading(actions.save, false);
  }
};

const handleDelete = async () => {
  setLoading(actions.delete, true);
  try {
    /* ... */
  } finally {
    setLoading(actions.delete, false);
  }
};

// Use in JSX
<div className="flex gap-2">
  <button disabled={isLoading(actions.save)} onClick={handleSave}>
    {isLoading(actions.save) ? "Saving..." : "Save"}
  </button>
  <button disabled={isLoading(actions.delete)} onClick={handleDelete}>
    {isLoading(actions.delete) ? "Deleting..." : "Delete"}
  </button>
</div>;
```

## Real-Time Features

### Listening to Socket Events

```jsx
import { useAuth } from "../context/AuthContext";

export const MyComponent = () => {
  const { socket } = useAuth();

  useEffect(() => {
    if (!socket) return;

    const handleEvent = (data) => {
      console.log("Event received:", data);
      // Update state
    };

    socket.on("eventName", handleEvent);

    return () => {
      socket.off("eventName", handleEvent);
    };
  }, [socket]);

  return <div>Component</div>;
};
```

### Available Socket Events

**Messages:**

- `newMessage` - New message received
- `messagesSeen` - Messages marked as seen
- `conversationUpdated` - Conversation info changed
- `conversationDeleted` - Conversation deleted

**Calls:**

- `call:incoming` - Incoming call notification
- `call:answer` - Recipient accepted call
- `call:ice` - ICE candidates for WebRTC
- `call:end` - Call ended

**Online Status:**

- `getOnlineUsers` - List of online user IDs

## Console Debugging

### Enable Logging (Already in Code)

```
// Monitor in browser DevTools Console tab
// Look for logs like:
// ✅ Socket connected: [userId]
// ✅ Received new message: {messageObject}
// ✅ Incoming call received: {callObject}
// ✅ Messages marked as seen: [conversationId]
```

### Common Console Errors & Fixes

| Error                               | Cause                                     | Fix                                         |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------- |
| "Cannot read property 'setLoading'" | useLoading called outside LoadingProvider | Wrap app in `<LoadingProvider>` in main.jsx |
| Socket events not received          | Socket not connected                      | Check socket connection logs                |
| Message doesn't appear              | Conversation ID mismatch                  | Check console logs for conversationId       |
| Call notification missing           | Server not emitting event                 | Check backend logs, restart server          |

## Best Practices

### 1. Always Clean Up Socket Listeners

```jsx
useEffect(() => {
  if (!socket) return;

  const handleEvent = (data) => {
    /* ... */
  };
  socket.on("eventName", handleEvent);

  // ✅ IMPORTANT: Clean up listener
  return () => {
    socket.off("eventName", handleEvent);
  };
}, [socket]);
```

### 2. Use Unique Loading Keys

```jsx
// ✅ Good - Unique identifier
setLoading(`delete_${conversationId}`, true);

// ❌ Bad - Too generic, conflicts possible
setLoading("delete", true);
```

### 3. Always Use Try-Catch-Finally

```jsx
// ✅ Good - Always cleans up loading state
try {
  setLoading("action", true);
  await apiCall();
} catch (error) {
  toast.error("Failed");
} finally {
  setLoading("action", false);
}

// ❌ Bad - Loading state stuck if error occurs
try {
  setLoading("action", true);
  await apiCall();
} catch (error) {
  setLoading("action", false);
}
```

### 4. Pass Loading Props to Child Components

```jsx
// ✅ Parent passes loading state to child
<RightSidebar
  isLoadingFavorite={isLoading(`favorite_${id}`)}
  onToggleFavorite={handleToggleFavorite}
/>

// Child component
<button disabled={isLoadingFavorite}>
  {isLoadingFavorite ? "Loading..." : "Favorite"}
</button>
```

## Testing Checklist

- [ ] Loading spinner appears when clicking action buttons
- [ ] Button is disabled while loading
- [ ] Spinner disappears after action completes
- [ ] Multiple actions can load independently
- [ ] Error toast appears on failure
- [ ] Loading state clears on error
- [ ] Console shows proper logging
- [ ] Socket events received in console
- [ ] Real-time updates work without page reload

## Troubleshooting

### Loading spinner not showing?

1. Check if LoadingProvider is in main.jsx
2. Verify component uses useLoading hook
3. Check if loading key is correct
4. Look for console errors

### Socket events not working?

1. Check browser Network tab → WS (WebSocket)
2. Look for "Socket connected" in console
3. Check server logs for emission
4. Restart backend server

### Multiple loading states conflicting?

1. Use unique keys for each action
2. Include conversationId/itemId in key
3. Use pattern: `action_${id}_${subId}`

## Performance Tips

1. Use unique loading keys to avoid state collisions
2. Clean up socket listeners to prevent memory leaks
3. Use loading context instead of local state for shared loading
4. Avoid creating spinners with too many dependencies
5. Use inline spinners for buttons to keep animations smooth
