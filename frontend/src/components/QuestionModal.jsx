import { useState } from "react";
import { useGameStore } from "../store";
import { submitAnswer } from "../api/client";

export default function QuestionModal() {
  const { playerId, question, clearQuestion } = useGameStore();
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!question) return null;
  const q = question.question;

  const handleSubmit = async () => {
    if (selected === null || isSubmitting) return;
    
    setIsSubmitting(true);
    const correct = selected === q.correct_index;
    const rt = Date.now() - question.started_at;
    
    try {
      const result = await submitAnswer({
        player_id: playerId,
        concept_key: question.concept.key,
        correct,
        response_time_ms: rt,
      });
      
      setFeedback({ correct, explanation: q.explanation, result });
      
      // Keep feedback visible for 3 seconds, then close
      setTimeout(() => {
        setFeedback(null);
        setSelected(null);
        setIsSubmitting(false);
        clearQuestion();
      }, 3000);
    } catch (err) {
      console.error("Answer submission failed:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-void border-2 border-ruby/50 rounded-2xl p-8 max-w-xl w-full shadow-[0_0_50px_rgba(168,85,247,0.2)]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="px-3 py-1 bg-dark/40 border border-ruby/30 rounded-full text-[10px] text-orange uppercase tracking-widest font-bold">
            {question.concept.category.replace("_", " ")}
          </div>
          <div className="text-xs text-red font-mono">
            Difficulty: {question.concept.difficulty}/5
          </div>
        </div>

        {/* Concept Name */}
        <h3 className="text-yellow text-sm uppercase tracking-widest mb-2 font-bold opacity-60">
          Scanning Concept: {question.concept.name}
        </h3>

        {/* Question Text */}
        <h2 className="text-2xl text-bright-yellow font-bold leading-tight mb-8">
          {q.question}
        </h2>

        {/* Choices */}
        <div className="space-y-3">
          {q.choices.map((choice, i) => {
            let style = "border-ruby/20 hover:border-yellow/50 hover:bg-yellow/5";
            
            if (selected === i) {
              style = "border-yellow bg-yellow/10 text-yellow shadow-[0_0_15px_rgba(125,249,255,0.2)]";
            }
            
            if (feedback) {
              if (i === q.correct_index) {
                style = "border-green-500 bg-green-500/20 text-green-400";
              } else if (selected === i && i !== q.correct_index) {
                style = "border-red-500 bg-red-500/20 text-red-400";
              } else {
                style = "opacity-30 border-ruby/10";
              }
            }

            return (
              <button
                key={i}
                disabled={!!feedback}
                onClick={() => setSelected(i)}
                className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-200 group flex items-center gap-4 ${style}`}
              >
                <span className="w-8 h-8 rounded-lg bg-dark/30 border border-ruby/30 flex items-center justify-center text-xs group-hover:bg-yellow group-hover:text-void transition-colors">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm font-medium">{choice.split(") ").pop()}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Section */}
        {feedback ? (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`text-lg font-bold mb-2 ${feedback.correct ? "text-green-400" : "text-red-400"}`}>
              {feedback.correct ? "✓ NEURAL LINK STABILIZED" : "✗ RECALL FAILURE"}
            </div>
            <p className="text-yellow text-sm leading-relaxed bg-dark/20 p-4 rounded-lg border border-ruby/10">
              {feedback.explanation}
            </p>
            <div className="mt-4 flex gap-4 text-[10px] text-red font-mono uppercase tracking-widest">
              <div>New Half-Life: <span className="text-yellow">{feedback.result.updated.half_life.toFixed(1)}s</span></div>
              <div>Streak: <span className="text-yellow">{feedback.result.updated.streak}</span></div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={selected === null || isSubmitting}
            className="mt-8 w-full py-4 bg-yellow text-void font-black uppercase tracking-[0.3em] rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
          >
            {isSubmitting ? "Processing..." : "Commit Answer"}
          </button>
        )}
      </div>
    </div>
  );
}
