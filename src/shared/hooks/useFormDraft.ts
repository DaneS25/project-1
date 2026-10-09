import { useRef, useState } from 'react'
import type { Result } from '@/shared/types'

/** An error message per field; a missing or undefined entry means valid. */
export type FieldErrors<Draft> = Partial<
  Record<keyof Draft, string | undefined>
>

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

/**
 * Draft state for a form whose fields are all text: the typed values, an
 * error per field, and a way to focus fields. `register(field)` gives a ref
 * callback for that field's control. `check` runs a validator and, on
 * failure, shows the errors and focuses the first invalid field (the
 * validator's key order should follow the form's field order).
 */
export function useFormDraft<Draft extends Record<string, string>>(
  initial: Draft,
) {
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<FieldErrors<Draft>>({})
  const elements = useRef(new Map<keyof Draft, FieldElement>())

  /** Updates one field and clears its error. */
  function change(field: keyof Draft, value: string) {
    setDraft({ ...draft, [field]: value })
    if (errors[field]) setErrors({ ...errors, [field]: undefined })
  }

  function register(field: keyof Draft) {
    return (element: FieldElement | null) => {
      if (element) elements.current.set(field, element)
      else elements.current.delete(field)
    }
  }

  function focus(field: keyof Draft) {
    elements.current.get(field)?.focus()
  }

  function check<Value>(
    validate: (draft: Draft) => Result<Value, FieldErrors<Draft>>,
  ): Value | null {
    const result = validate(draft)
    if (result.ok) {
      setErrors({})
      return result.value
    }
    setErrors(result.error)
    const firstInvalid = Object.keys(result.error).find(
      (field) => result.error[field],
    )
    if (firstInvalid !== undefined) focus(firstInvalid)
    return null
  }

  return { draft, setDraft, errors, change, register, focus, check }
}

export type FormDraft<Draft extends Record<string, string>> = ReturnType<
  typeof useFormDraft<Draft>
>
