const EMOJI_LIST = [
  '🏃', '💪', '📖', '💊', '🧘', '🎯', '💧', '🥗',
  '🚶', '🏋️', '📝', '🧠', '😴', '🎵', '🌱', '💻',
  '🍎', '🚴', '🧹', '🎨', '📱', '🏠', '🐕', '☀️',
  '🌙', '✅', '⭐', '🔥', '💎', '🏆', '❤️', '🌊',
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className="emoji-picker-grid">
      {EMOJI_LIST.map(emoji => (
        <button
          key={emoji}
          type="button"
          className={`emoji-btn ${value === emoji ? 'selected' : ''}`}
          onClick={() => onChange(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
