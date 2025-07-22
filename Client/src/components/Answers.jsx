import React from "react";

// Display a single answer string
const Answer = ({ ans }) => {
  console.log(ans);
  return <div className="answer-item p-2 text-left">{ans}</div>;
};

export default Answer;
