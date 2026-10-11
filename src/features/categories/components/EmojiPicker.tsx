import { useId } from 'react'
import formStyles from '@/shared/components/Form.module.css'
import {
  CATEGORY_EMOJIS,
  emojiName,
  type EmojiChoice,
} from '@/shared/lib/emoji'
import styles from './EmojiPicker.module.css'

type EmojiPickerProps = {
  /** The chosen emoji, or '' for none. */
  value: string
  error: string | undefined
  errorId: string
  onChange: (emoji: string) => void
}

/**
 * A radio group of curated emojis plus "None". Each emoji is shown but
 * hidden from screen readers, which hear its text name instead. An emoji
 * saved earlier that isn't in the list is offered first, so editing a
 * category never drops it silently.
 */
export function EmojiPicker({
  value,
  error,
  errorId,
  onChange,
}: EmojiPickerProps) {
  const groupName = useId()
  const isOffered = CATEGORY_EMOJIS.some((choice) => choice.emoji === value)
  const choices: readonly EmojiChoice[] =
    value === '' || isOffered
      ? CATEGORY_EMOJIS
      : [{ emoji: value, name: emojiName(value) }, ...CATEGORY_EMOJIS]

  return (
    <fieldset
      className={styles.fieldset}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className={formStyles.label}>
        Emoji <span className={formStyles.labelSuffix}>(optional)</span>
      </legend>
      <div className={styles.grid}>
        <label className={[styles.option, styles.none].join(' ')}>
          <input
            className={styles.input}
            type="radio"
            name={groupName}
            value=""
            checked={value === ''}
            onChange={() => {
              onChange('')
            }}
          />
          None
        </label>
        {choices.map((choice) => (
          <label key={choice.emoji} className={styles.option}>
            <input
              className={styles.input}
              type="radio"
              name={groupName}
              value={choice.emoji}
              checked={value === choice.emoji}
              onChange={() => {
                onChange(choice.emoji)
              }}
            />
            <span className={styles.glyph} aria-hidden="true">
              {choice.emoji}
            </span>
            <span className={styles.name}>{choice.name}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className={formStyles.formError} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
