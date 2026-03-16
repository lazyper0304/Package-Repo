import React from 'react'
import styles from './index.module.less'

import ReactHighlighter from 'react-highlight-words'

type IProps = Readonly<{
  searchWords: string | string[]
  children: React.ReactNode
}>

const Highlighter: React.FC<IProps> = ({ searchWords, children }) => {
  return (
    <ReactHighlighter
      highlightClassName={styles.highlighter}
      searchWords={Array.isArray(searchWords) ? searchWords : [searchWords]}
      autoEscape={true}
      textToHighlight={children}
    />
  )
}

export default React.memo(Highlighter)
