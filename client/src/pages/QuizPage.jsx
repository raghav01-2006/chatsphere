import { useEffect, useState } from 'react';
import { Zap, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const QuizPage = () => {
  const { user, updateUser } = useAuthStore();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const res = await api.get('/game/quiz/daily');
        setQuestions(res.data.questions);
        setTimeLeft(res.data.questions[0]?.timeLimitSeconds || 30);
      } catch (err) {
        if (err.response?.data?.alreadyDone) setAlreadyDone(true);
        else toast.error('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, []);

  // Timer per question
  useEffect(() => {
    if (submitted || alreadyDone || questions.length === 0) return;
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      // Auto next question
      if (currentQ < questions.length - 1) {
        setCurrentQ(p => p + 1);
        setTimeLeft(questions[currentQ + 1]?.timeLimitSeconds || 30);
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted, alreadyDone, currentQ]);

  const selectAnswer = (qId, idx) => {
    if (submitted) return;
    setAnswers(a => ({ ...a, [qId]: idx }));
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(p => p + 1);
      setTimeLeft(questions[currentQ + 1]?.timeLimitSeconds || 30);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = questions.map(q => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] ?? -1,
      }));
      const res = await api.post('/game/quiz/submit', { answers: payload });
      setResults(res.data);
      setSubmitted(true);
      updateUser({ xp: res.data.totalXP });
      if (res.data.xpEarned > 0) toast.success(`+${res.data.xpEarned} XP earned! 🎉`);
    } catch {
      toast.error('Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = { easy: 'text-success', medium: 'text-warning', hard: 'text-error' };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (alreadyDone) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <CheckCircle size={48} className="text-success mb-4" />
      <h2 className="text-2xl font-bold mb-2">Daily Quiz Complete!</h2>
      <p className="text-text-muted mb-2">Come back tomorrow for a new set of questions.</p>
      <p className="text-xs text-text-disabled">Your XP has been recorded 🏆</p>
    </div>
  );

  if (submitted && results) {
    const [correct, total] = results.score.split('/').map(Number);
    const pct = Math.round((correct / total) * 100);

    return (
      <div className="h-full overflow-y-auto scrollbar-none p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">{pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '💪'}</div>
            <h2 className="text-3xl font-black mb-2">{results.score}</h2>
            <p className="text-text-muted mb-2">{pct}% accuracy</p>
            {results.xpEarned > 0 && (
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 border text-sm">
                <Zap size={14} className="text-warning" />
                <span>+{results.xpEarned} XP earned</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {results.results.map((r, i) => (
              <div key={i} className={`card border ${r.isCorrect ? 'border-success/30' : 'border-error/30'}`}>
                <div className="flex items-start gap-3 mb-3">
                  {r.isCorrect
                    ? <CheckCircle size={18} className="text-success flex-shrink-0 mt-0.5" />
                    : <XCircle size={18} className="text-error flex-shrink-0 mt-0.5" />
                  }
                  <p className="text-sm font-medium">{r.question}</p>
                </div>
                <div className="pl-7 space-y-1">
                  {['A', 'B', 'C', 'D'].slice(0, questions[i]?.options?.length || 4).map((opt, idx) => {
                    const isCorrect = idx === r.correctAnswer;
                    const isSelected = idx === r.selectedAnswer;
                    return (
                      <div key={idx}
                        className={`px-3 py-2 rounded-lg text-xs ${
                          isCorrect ? 'bg-success/10 text-success border border-success/20' :
                          isSelected && !isCorrect ? 'bg-error/10 text-error border border-error/20' :
                          'text-text-muted'
                        }`}>
                        {opt}. {questions[i]?.options[idx]}
                      </div>
                    );
                  })}
                  {r.explanation && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-text-muted">
                      <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                      <span>{r.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return (
    <div className="h-full flex items-center justify-center text-text-muted">No quiz questions available. Ask an admin to seed questions.</div>
  );

  const q = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const timerPct = (timeLeft / (q.timeLimitSeconds || 30)) * 100;

  return (
    <div className="h-full overflow-y-auto scrollbar-none p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><Zap size={20} className="text-warning" /> Daily Quiz</h2>
            <p className="text-text-muted text-sm">Question {currentQ + 1} of {questions.length}</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black ${timeLeft <= 5 ? 'text-error animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </div>
            <p className="text-[11px] text-text-muted">remaining</p>
          </div>
        </div>

        {/* Overall progress */}
        <div className="xp-bar mb-2">
          <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Timer bar */}
        <div className="h-0.5 bg-border-subtle rounded-full mb-6 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-error' : 'bg-white'}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>

        {/* Question card */}
        <div className="card-elevated mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 bg-bg-tertiary rounded-full">{q.category}</span>
            <span className={`text-xs font-medium ${difficultyColor[q.difficulty]}`}>{q.difficulty}</span>
            <span className="ml-auto text-xs text-warning flex items-center gap-1"><Zap size={10} /> +{q.xpReward} XP</span>
          </div>
          <p className="text-base font-semibold leading-relaxed">{q.question}</p>
        </div>

        {/* Options */}
        <div className="space-y-2 mb-6">
          {q.options.map((opt, idx) => {
            const selected = answers[q._id] === idx;
            return (
              <button
                key={idx}
                onClick={() => selectAnswer(q._id, idx)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                  selected
                    ? 'bg-white text-black border-white'
                    : 'bg-bg-tertiary border-border-subtle hover:border-border-strong hover:bg-bg-elevated text-text-primary'
                }`}
              >
                <span className="text-text-muted mr-2">{['A', 'B', 'C', 'D'][idx]}.</span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < currentQ ? 'bg-success' :
                  i === currentQ ? 'bg-white' : 'bg-border-default'
                }`}
              />
            ))}
          </div>

          {currentQ < questions.length - 1 ? (
            <button onClick={handleNext} className="btn-primary">Next →</button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
