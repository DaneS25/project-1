import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ChartCarousel,
  SCROLL_GUARD_MS,
  type ChartSlide,
} from './ChartCarousel'

const slides: ChartSlide[] = [
  { id: 'a', title: 'Where the money went', content: <p>Donut</p> },
  { id: 'b', title: 'Spending trend', content: <p>Bars</p> },
  { id: 'c', title: 'Budget vs actual', content: <p>Paired bars</p> },
]

function renderCarousel() {
  render(<ChartCarousel slides={slides} />)
}

const track = () => screen.getByRole('region', { name: 'Charts' })
const dot = (title: string) =>
  within(screen.getByRole('group', { name: 'Choose a chart' })).getByRole(
    'button',
    { name: new RegExp(`^${title}`) },
  )
// Only the current card is exposed, so the visible heading is the current one.
const currentHeading = () => within(track()).getByRole('heading', { level: 3 })
const announcement = () => screen.getByRole('status')

describe('ChartCarousel', () => {
  it('starts on the first chart, with only it exposed and no announcement', () => {
    renderCarousel()

    expect(currentHeading()).toHaveTextContent('Where the money went')
    expect(within(track()).getAllByRole('heading')).toHaveLength(1)
    expect(dot('Where the money went')).toHaveAttribute('aria-current', 'true')
    expect(announcement()).toBeEmptyDOMElement()
  })

  it('moves with Next and Previous and announces the chart', async () => {
    renderCarousel()

    await userEvent.click(screen.getByRole('button', { name: 'Next chart' }))
    expect(currentHeading()).toHaveTextContent('Spending trend')
    expect(announcement()).toHaveTextContent('Chart 2 of 3: Spending trend')
    expect(dot('Spending trend')).toHaveAttribute('aria-current', 'true')
    expect(dot('Where the money went')).not.toHaveAttribute('aria-current')

    await userEvent.click(
      screen.getByRole('button', { name: 'Previous chart' }),
    )
    expect(currentHeading()).toHaveTextContent('Where the money went')
    expect(announcement()).toHaveTextContent(
      'Chart 1 of 3: Where the money went',
    )
  })

  it('stays put at the ends, keeping the end buttons focusable', async () => {
    renderCarousel()
    const previous = screen.getByRole('button', { name: 'Previous chart' })

    await userEvent.click(previous)

    expect(previous).toHaveAttribute('aria-disabled', 'true')
    expect(previous).toBeEnabled()
    expect(currentHeading()).toHaveTextContent('Where the money went')
    expect(announcement()).toBeEmptyDOMElement()
  })

  it('jumps to a chart from its dot', async () => {
    renderCarousel()

    await userEvent.click(dot('Budget vs actual'))

    expect(currentHeading()).toHaveTextContent('Budget vs actual')
    expect(announcement()).toHaveTextContent('Chart 3 of 3: Budget vs actual')
    expect(screen.getByRole('button', { name: 'Next chart' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('names each dot after its chart and position', () => {
    renderCarousel()

    expect(
      screen.getByRole('button', { name: 'Spending trend, chart 2 of 3' }),
    ).toBeInTheDocument()
  })

  it('moves with the arrow keys, Home and End while the strip has focus', async () => {
    renderCarousel()
    track().focus()

    await userEvent.keyboard('{ArrowRight}')
    expect(currentHeading()).toHaveTextContent('Spending trend')

    await userEvent.keyboard('{End}')
    expect(currentHeading()).toHaveTextContent('Budget vs actual')

    await userEvent.keyboard('{ArrowRight}')
    expect(currentHeading()).toHaveTextContent('Budget vs actual')

    await userEvent.keyboard('{ArrowLeft}')
    expect(currentHeading()).toHaveTextContent('Spending trend')

    await userEvent.keyboard('{Home}')
    expect(currentHeading()).toHaveTextContent('Where the money went')
    expect(track()).toHaveFocus()
  })

  it('leaves arrow keys inside a card to that card', async () => {
    render(
      <ChartCarousel
        slides={[
          {
            id: 'a',
            title: 'Category over time',
            content: (
              <select aria-label="Category">
                <option>Food</option>
                <option>Rent</option>
              </select>
            ),
          },
          { id: 'b', title: 'Spending trend', content: <p>Bars</p> },
        ]}
      />,
    )
    screen.getByRole('combobox', { name: 'Category' }).focus()

    await userEvent.keyboard('{ArrowRight}')
    expect(currentHeading()).toHaveTextContent('Category over time')
  })

  it('hides the other cards from screen readers and the keyboard', () => {
    renderCarousel()

    const hidden = within(track())
      .getAllByRole('group', { hidden: true })
      .filter((slide) => slide.getAttribute('aria-hidden') === 'true')

    expect(hidden).toHaveLength(2)
    for (const slide of hidden) expect(slide).toHaveAttribute('inert')
  })
})

describe('ChartCarousel when a swipe interrupts a button scroll', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // jsdom has no layout or scrolling, so give the strip a width, a fake
  // scrollTo, and a scroll position the test can move.
  function measurableTrack() {
    const strip = track()
    let position = 0
    Object.defineProperty(strip, 'clientWidth', { value: 300 })
    Object.defineProperty(strip, 'scrollLeft', {
      get: () => position,
      configurable: true,
    })
    Object.defineProperty(strip, 'scrollTo', { value: vi.fn() })
    return {
      strip,
      swipeTo: (index: number) => {
        position = index * 300
        // Scrolling isn't a user action userEvent can make in jsdom.
        fireEvent.scroll(strip)
      },
    }
  }

  it('follows the real position once the scroll ends', async () => {
    renderCarousel()
    const { strip, swipeTo } = measurableTrack()

    await userEvent.click(screen.getByRole('button', { name: 'Next chart' }))
    // The user swipes on to the third card before the scroll arrives.
    swipeTo(2)
    expect(currentHeading()).toHaveTextContent('Spending trend')

    fireEvent(strip, new Event('scrollend'))

    expect(currentHeading()).toHaveTextContent('Budget vs actual')
    expect(announcement()).toHaveTextContent('Chart 3 of 3: Budget vs actual')
  })

  it('releases the guard after a fallback time if scrollend never comes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderCarousel()
    const { swipeTo } = measurableTrack()

    await userEvent.click(screen.getByRole('button', { name: 'Next chart' }))
    swipeTo(2)
    act(() => {
      vi.advanceTimersByTime(SCROLL_GUARD_MS)
    })

    expect(currentHeading()).toHaveTextContent('Budget vs actual')
  })

  it('follows later swipes once the guard is released', async () => {
    renderCarousel()
    const { strip, swipeTo } = measurableTrack()
    await userEvent.click(screen.getByRole('button', { name: 'Next chart' }))
    swipeTo(2)
    fireEvent(strip, new Event('scrollend'))

    swipeTo(0)

    expect(currentHeading()).toHaveTextContent('Where the money went')
  })
})
