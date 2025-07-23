import React from "react";
import DeleteButton from "./DeleteBtn";

export default function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isMobile = false,
  onClose,
}) {
  return (
    <div
      className={`
        ${isMobile ? "flex" : "hidden md:flex"} 
          flex flex-col w-full h-full bg-gray-800 text-white p-4 overflow-y-auto
      `}
    >
      {/* Close button only visible on mobile */}
      {isMobile && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="text-white text-2xl hover:text-red-400"
          >
            ✕
          </button>
        </div>
      )}

      <button
        onClick={onNewChat}
        className="w-full mb-4 p-2 bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer transition-all duration-300 ease-in-out"
      >
        + New Chat
      </button>

      <div className="space-y-2 overflow-y-auto">
        {chats.map((chat) => {
          const isCurrent = chat.id === currentChatId;
          const isNewChat = chat.title === "New Chat";
          const showDelete = chats.length > 1 && !(isCurrent && isNewChat);

          return (
            <div
              key={chat.id}
              className={`flex justify-between w-full items-center p-3 rounded-xl cursor-pointer ${
                isCurrent ? "bg-transparent" : "hover:bg-gray-700 rounded-xl"
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
