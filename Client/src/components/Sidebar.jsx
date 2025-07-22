import React from "react";
import DeleteButton from "./DeleteBtn";

export default function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}) {
  return (
    <div className="w-full h-full bg-gray-800 text-white p-4">
      <button
        onClick={onNewChat}
        className="w-full mb-4 p-2 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer"
      >
        + New Chat
      </button>

      <div className="space-y-2">
        {chats.map((chat) => {
          const isCurrent = chat.id === currentChatId;
          const isNewChat = chat.title === "New Chat";
          const showDelete = chats.length > 1 && !(isCurrent && isNewChat);

          return (
            <div
              key={chat.id}
              className={`flex justify-between items-center p-2 rounded cursor-pointer ${
                isCurrent ? "bg-transparent" : "hover:bg-gray-700"
              }`}
            >
              <span onClick={() => onSelectChat(chat.id)}>{chat.title}</span>

              {showDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                >
                  <DeleteButton />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
