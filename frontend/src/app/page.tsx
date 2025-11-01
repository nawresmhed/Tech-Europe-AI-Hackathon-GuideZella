"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

export default function GuideZellaChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const playAudio = async (text) => {
    try {
      const res = await fetch(
        `http://localhost:5000/tts?text=${encodeURIComponent(text)}`
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      new Audio(url).play();
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { type: "user", text: input }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.replace("data:", "").split("\n\n").join("\n");

        setMessages((prev) => [...prev, { type: "bot", text: parts }]);
        await playAudio(parts);

        buffer = "";
      }
    } catch (err) {
      console.error("Streaming error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript);
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const handleStopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f2937] via-[#111827] to-[#0f172a] text-white font-sans transition-colors">
      <div className="max-w-4xl h-full mx-auto px-4 py-8">
        <div className="bg-[#1e293b] h-full rounded-2xl shadow-xl p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-full">🧭</div>
              <div>
                <h1 className="text-xl font-bold">GuideZella</h1>
                <p className="text-sm text-gray-400">AI Location Discovery</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span className="text-sm text-gray-400">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "items-start gap-3"
                }`}
              >
                {msg.type === "bot" && (
                  <div className="bg-purple-600 p-2 rounded-full">🤖</div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[85%] shadow ${
                    msg.type === "user"
                      ? "bg-gradient-to-br from-purple-500 to-indigo-500 text-white"
                      : "bg-[#334155] text-white"
                  }`}
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-3 mt-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              className="flex-1 px-4 py-3 rounded-xl bg-[#0f172a] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={listening ? handleStopListening : handleStartListening}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-3 rounded-xl transition"
            >
              {listening ? "🛑" : "🎤"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "⏳" : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
