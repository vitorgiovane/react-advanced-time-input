import React, { ChangeEvent, CSSProperties, ReactElement, FocusEvent } from 'react'

const DEFAULT_COLON = ':'
const DEFAULT_VALUE_SHORT = `00${DEFAULT_COLON}00`
const DEFAULT_VALUE_FULL = `00${DEFAULT_COLON}00${DEFAULT_COLON}00`

export function isNumber<T> (value: T): boolean {
  const number = Number(value)
  return !isNaN(number) && String(value) === String(number)
}

export function formatTimeItem (value?: string | number): string {
  return `${value || ''}00`.substr(0, 2)
}

interface DecimalBlock {
  newDecimalBlock: string
  newCursorBlockPosition: number
}

function buildDecimalPlace (
  oldDecimalBlock: string,
  newDecimalBlock: string,
  maxDecimalBlock: number,
  newCursorBlockPosition: number
): DecimalBlock {
  if (!oldDecimalBlock) return { newDecimalBlock, newCursorBlockPosition }

  const firstDigitOfMaxDecimalBlock = Number(maxDecimalBlock.toString()[0])
  const secondDigitOfMaxDecimalBlock = Number(maxDecimalBlock.toString()[1])

  const firstDigitOfOldDecimalBlock = Number(oldDecimalBlock[0])
  const secondDigitOfOldDecimalBlock = Number(oldDecimalBlock[1])

  const firstDigitOfNewDecimalBlock = Number(newDecimalBlock[0])
  const secondDigitOfNewDecimalBlock = Number(newDecimalBlock[1])

  if (firstDigitOfNewDecimalBlock > firstDigitOfMaxDecimalBlock) {
    newDecimalBlock = oldDecimalBlock
    newCursorBlockPosition -= 1
  } else if (firstDigitOfNewDecimalBlock === firstDigitOfMaxDecimalBlock) {
    if (firstDigitOfOldDecimalBlock === firstDigitOfMaxDecimalBlock && secondDigitOfNewDecimalBlock > secondDigitOfMaxDecimalBlock) {
      newDecimalBlock = `${firstDigitOfMaxDecimalBlock}${secondDigitOfOldDecimalBlock}`
      newCursorBlockPosition -= 2
    } else if (secondDigitOfNewDecimalBlock > secondDigitOfMaxDecimalBlock) {
      newDecimalBlock = maxDecimalBlock.toString()
    }
  }

  return { newDecimalBlock, newCursorBlockPosition }
}

export function validateTimeAndCursor (
  showSeconds = false,
  value = '',
  defaultValue = '',
  colon = DEFAULT_COLON,
  cursorPosition = 0,
  maxHours = 23,
  maxMinutes = 59,
  maxSeconds = 59
): [string, number] {
  const [oldHours, oldMinutes, oldSeconds] = defaultValue.split(colon)

  let newCursorPosition = Number(cursorPosition)
  let [newHours, newMinutes, newSeconds] = String(value).split(colon)

  newHours = formatTimeItem(newHours)
  const {
    newDecimalBlock: newHoursBlock,
    newCursorBlockPosition: newCursorHoursPosition
  } = buildDecimalPlace(oldHours, newHours, maxHours, newCursorPosition)
  newHours = newHoursBlock
  newCursorPosition = newCursorHoursPosition

  newMinutes = formatTimeItem(newMinutes)
  const {
    newDecimalBlock: newMinutesBlock,
    newCursorBlockPosition: newCursorMinutesPosition
  } = buildDecimalPlace(oldMinutes, newMinutes, maxMinutes, newCursorPosition)
  newMinutes = newMinutesBlock
  newCursorPosition = newCursorMinutesPosition

  if (showSeconds) {
    newSeconds = formatTimeItem(newSeconds)
    const {
      newDecimalBlock: newSecondsBlock,
      newCursorBlockPosition: newCursorSecondsPosition
    } = buildDecimalPlace(oldSeconds, newSeconds, maxSeconds, newCursorPosition)
    newSeconds = newSecondsBlock
    newCursorPosition = newCursorSecondsPosition
  }

  const validatedValue = showSeconds
    ? `${newHours}${colon}${newMinutes}${colon}${newSeconds}`
    : `${newHours}${colon}${newMinutes}`

  return [validatedValue, newCursorPosition]
}

type onChangeType = (event: ChangeEvent<HTMLInputElement>, value: string) => void

interface Props {
  value?: string
  onChange?: onChangeType
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  showSeconds?: boolean
  input: ReactElement | null
  inputRef?: () => HTMLInputElement | null
  colon?: string
  style?: CSSProperties | {}
  maxHours?: number
  maxMinutes?: number
  maxSeconds?: number
}

interface State {
  value: string
  _colon: string
  _defaultValue: string
  _showSeconds: boolean
  _maxLength: number
  _maxHours?: number
  _maxMinutes?: number
  _maxSeconds?: number
}

export default class TimeInput extends React.Component<Props, State> {
  static defaultProps: Props = {
    showSeconds: false,
    input: null,
    style: {},
    colon: DEFAULT_COLON,
    maxHours: 23,
    maxMinutes: 59,
    maxSeconds: 59
  }

  constructor (props: Props) {
    super(props)

    const _showSeconds = Boolean(props.showSeconds)
    const _defaultValue = _showSeconds ? DEFAULT_VALUE_FULL : DEFAULT_VALUE_SHORT
    const _colon = props.colon && props.colon.length === 1 ? props.colon : DEFAULT_COLON
    const { maxHours: _maxHours, maxMinutes: _maxMinutes, maxSeconds: _maxSeconds } = props
    const [validatedTime] = validateTimeAndCursor(
      _showSeconds,
      this.props.value,
      _defaultValue,
      _colon,
      0,
      _maxHours,
      _maxMinutes,
      _maxSeconds
    )

    this.state = {
      value: validatedTime,
      _colon,
      _showSeconds,
      _defaultValue,
      _maxLength: _defaultValue.length,
      _maxHours,
      _maxMinutes,
      _maxSeconds
    }

    this.onInputChange = this.onInputChange.bind(this)
  }

  componentDidUpdate (prevProps: Props): void {
    if (this.props.value !== prevProps.value) {
      const [validatedTime] = validateTimeAndCursor(
        this.state._showSeconds,
        this.props.value,
        this.state._defaultValue,
        this.state._colon,
        0,
        this.props.maxHours,
        this.props.maxMinutes,
        this.props.maxSeconds
      )

      this.setState({
        value: validatedTime
      })
    }
  }

  onInputChange (event: ChangeEvent<HTMLInputElement>, callback: onChangeType): void {
    const oldValue = this.state.value
    const inputEl = event.target
    const inputValue = inputEl.value
    const position = inputEl.selectionEnd || 0
    const isTyped = inputValue.length > oldValue.length
    const cursorCharacter = inputValue[position - 1]
    const addedCharacter = isTyped ? cursorCharacter : null
    const removedCharacter = isTyped ? null : oldValue[position]
    const replacedSingleCharacter = inputValue.length === oldValue.length ? oldValue[position - 1] : null
    const colon = this.state._colon

    let newValue = oldValue
    let newPosition = position

    if (addedCharacter !== null) {
      if (position > this.state._maxLength) {
        newPosition = this.state._maxLength
      } else if ((position === 3 || position === 6) && addedCharacter === colon) {
        newValue = `${inputValue.substr(0, position - 1)}${colon}${inputValue.substr(position + 1)}`
      } else if ((position === 3 || position === 6) && isNumber(addedCharacter)) {
        newValue = `${inputValue.substr(0, position - 1)}${colon}${addedCharacter}${inputValue.substr(position + 2)}`
        newPosition = position + 1
      } else if (isNumber(addedCharacter)) {
        // user typed a number
        newValue = inputValue.substr(0, position - 1) + addedCharacter + inputValue.substr(position + 1)
        if (position === 2 || position === 5) {
          newPosition = position + 1
        }
      } else {
        // if user typed NOT a number, then keep old value & position
        newPosition = position - 1
      }
    } else if (replacedSingleCharacter !== null) {
      // user replaced only a single character
      if (isNumber(cursorCharacter)) {
        if (position - 1 === 2 || position - 1 === 5) {
          newValue = `${inputValue.substr(0, position - 1)}${colon}${inputValue.substr(position)}`
        } else {
          newValue = inputValue
        }
      } else {
        // user replaced a number on some non-number character
        newValue = oldValue
        newPosition = position - 1
      }
    } else if (typeof cursorCharacter !== 'undefined' && cursorCharacter !== colon && !isNumber(cursorCharacter)) {
      // set of characters replaced by non-number
      newValue = oldValue
      newPosition = position - 1
    } else if (removedCharacter !== null) {
      if ((position === 2 || position === 5) && removedCharacter === colon) {
        newValue = `${inputValue.substr(0, position - 1)}0${colon}${inputValue.substr(position)}`
        newPosition = position - 1
      } else {
        // user removed a number
        newValue = `${inputValue.substr(0, position)}0${inputValue.substr(position)}`
      }
    }

    const [validatedTime, validatedCursorPosition] = validateTimeAndCursor(
      this.state._showSeconds,
      newValue,
      oldValue,
      colon,
      newPosition,
      this.props.maxHours,
      this.props.maxMinutes,
      this.props.maxSeconds
    )

    this.setState({ value: validatedTime }, () => {
      inputEl.selectionStart = validatedCursorPosition
      inputEl.selectionEnd = validatedCursorPosition
      callback(event, validatedTime)
    })

    event.persist()
  }

  render (): ReactElement {
    const { value } = this.state
    const {
      onChange,
      onFocus,
      onKeyDown,
      onBlur,
      style,
      showSeconds,
      input,
      inputRef,
      colon,
      maxHours,
      maxMinutes,
      maxSeconds,
      ...props
    } = this.props
    const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) =>
      this.onInputChange(event, (e: ChangeEvent<HTMLInputElement>, v: string) => onChange && onChange(e, v))

    if (input) {
      return React.cloneElement(input, {
        ...props,
        value,
        style,
        onChange: onChangeHandler
      })
    }

    return (
      <input
        type="text"
        {...props}
        ref={inputRef}
        value={value}
        onChange={onChangeHandler}
        onKeyDown={(event) => onKeyDown && onKeyDown(event)}
        onFocus={(event) => onFocus && onFocus(event)}
        onBlur={(event) => onBlur && onBlur(event)}
        style={{ width: showSeconds ? 54 : 35, ...style }}
      />
    )
  }
}
