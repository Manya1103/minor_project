import React, { useState, useEffect } from "react";
import { processVoiceCommand } from "../services/api";

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [messages, setMessages] = useState([]); // {role, text}
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();

      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-IN"; // Supports Hindi + English + Hinglish

      rec.onresult = async (event) => {
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (!event.results[i].isFinal) {
            setLiveText(transcript);
          } else {
            finalText += transcript;
          }
        }

        if (finalText.trim() === "") return;

        setLiveText("");
        addMessage("user", finalText);

        try {
          const res = await processVoiceCommand({ transcript: finalText });

          const reply =
            res?.data?.response || "Sorry, I didn’t understand that.";
          const lang = res?.data?.lang || "en"; // from backend "hi" or "en"

          addMessage("assistant", reply);
          speak(reply, lang);

          // If an expense was added → refresh UI
          if (res?.data?.action === "add_expense") {
            setTimeout(() => window.location.reload(), 1500);
          }
        } catch (err) {
          addMessage("assistant", "Error processing your request.");
          speak("Error processing your request.", "en");
        }

        setIsListening(false);
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      setRecognition(rec);
    }
  }, []);

  // ✅ Add chat messages
  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  // ✅ Smart voice output with Hindi/English auto voice selection
  const speak = (text, lang = "en") => {
    if (!("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // ✅ Start / Stop mic
  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      window.speechSynthesis.cancel();
      setLiveText("");
      setIsListening(true);
      recognition.start();
    }
  };

  if (!recognition) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
      {(isListening || messages.length > 0) && (
        <div className="w-[90vw] sm:w-[340px] max-w-[340px] max-h-[60vh] overflow-hidden mb-3 backdrop-blur-md bg-gray-900/70 border border-white/[0.08] shadow-2xl rounded-2xl text-gray-200">
          <div className="flex items-center justify-between px-3 sm:px-3.5 py-2 sm:py-2.5 border-b border-white/[0.06]">
            <div className="font-bold tracking-wide text-sm sm:text-base">Assistant</div>
            <div className={`w-2.5 h-2.5 rounded-full transition-all ${
              isListening 
                ? 'bg-green-500 shadow-[0_0_0_6px_rgba(34,197,94,0.12)]' 
                : 'bg-gray-500'
            }`} />
          </div>

          <div className="p-2.5 sm:p-3 flex flex-col gap-2.5 max-h-[45vh] overflow-auto">
            {messages.slice(-5).map((m, index) => (
              <div
                key={index}
                className={`rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm leading-5 border ${
                  m.role === "user"
                    ? "self-end bg-blue-500/15 border-blue-500/25"
                    : "self-start bg-white/5 border-white/[0.06]"
                } ${m.role === "user" && liveText === m.text ? "opacity-85" : ""}`}
              >
                {m.text}
              </div>
            ))}

            {isListening && (
              <div className="flex items-end gap-1 h-6 sm:h-7 my-1">
                <span className="block w-1.5 h-2 bg-blue-400 rounded animate-wave"></span>
                <span className="block w-1.5 h-2 bg-blue-400 rounded animate-wave [animation-delay:0.1s]"></span>
                <span className="block w-1.5 h-2 bg-blue-400 rounded animate-wave [animation-delay:0.2s]"></span>
                <span className="block w-1.5 h-2 bg-blue-400 rounded animate-wave [animation-delay:0.3s]"></span>
                <span className="block w-1.5 h-2 bg-blue-400 rounded animate-wave [animation-delay:0.4s]"></span>
              </div>
            )}

            {liveText && (
              <div className="self-end rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm leading-5 bg-blue-500/15 border border-blue-500/25 opacity-85">
                {liveText}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={toggleListening}
        className={`w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center border-none text-white transition-all ${
          isListening
            ? 'bg-blue-700 shadow-[0_0_0_8px_rgba(37,99,235,0.18),0_6px_18px_rgba(0,0,0,0.35)] sm:shadow-[0_0_0_10px_rgba(37,99,235,0.18),0_8px_22px_rgba(0,0,0,0.35)]'
            : 'bg-blue-600 shadow-[0_8px_20px_rgba(37,99,235,0.35)] sm:shadow-[0_10px_24px_rgba(37,99,235,0.35)] hover:shadow-[0_10px_22px_rgba(37,99,235,0.45)] sm:hover:shadow-[0_12px_26px_rgba(37,99,235,0.45)] hover:-translate-y-0.5'
        }`}
        title="Voice Assistant"
      >
        <span className="material-symbols-outlined text-xl sm:text-2xl">
          {isListening ? "mic" : "mic_none"}
        </span>
      </button>
    </div>
  );
};

export default VoiceAssistant;
