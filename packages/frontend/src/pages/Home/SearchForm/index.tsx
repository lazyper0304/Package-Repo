import { Card, Heading, TextField } from '@radix-ui/themes'
import React, { useCallback, useRef } from 'react'

type IProps = Readonly<{
  onChange: (v: string) => void
}>

const SearchForm: React.FC<IProps> = ({ onChange }) => {
  const compositionRef = useRef(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (compositionRef.current) return

    onChange(e.target.value)
  }

  function handleCompositionStart(e: React.CompositionEvent<HTMLInputElement>) {
    compositionRef.current = true
  }

  function handleCompositionUpdate(e: React.CompositionEvent<HTMLInputElement>) {
    compositionRef.current = true
  }

  function handleCompositionEnd(e: React.CompositionEvent<HTMLInputElement>) {
    compositionRef.current = false

    handleChange(e)
  }

  return (
    <>
      <Card size='3'>
        <Heading as='h1' style={{ marginBottom: 24 }}>
          🔍 搜索应用
        </Heading>

        <TextField.Root
          placeholder='输入关键字'
          onCompositionStart={handleCompositionStart}
          onCompositionUpdate={handleCompositionUpdate}
          onCompositionEnd={handleCompositionEnd}
          onChange={handleChange}
        >
          <TextField.Slot></TextField.Slot>
        </TextField.Root>
      </Card>
    </>
  )
}

export default React.memo(SearchForm)
