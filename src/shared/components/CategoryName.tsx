import styles from './CategoryName.module.css'

type CategoryNameProps = {
  name: string
  emoji?: string | undefined
}

/**
 * A category's name with its emoji in front, if it has one. The emoji is
 * decorative (`aria-hidden`), so screen readers read only the name. The name
 * keeps its own element so it can still be found by its text.
 */
export function CategoryName({ name, emoji }: CategoryNameProps) {
  if (emoji === undefined) return name
  return (
    <>
      <span className={styles.emoji} aria-hidden="true" data-category-emoji="">
        {emoji}
      </span>
      <span>{name}</span>
    </>
  )
}
