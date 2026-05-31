import { useState } from 'react'
import { useRequest } from 'ahooks'
import styles from './index.module.less'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { GradientBackground } from '../../components/GradientBackground'
import { SearchBar } from '../../components/SearchBar'
import { ToolCard } from '../../components/ToolCard'
import { tools } from '../../data/tools'

type ThemeMode = 'light' | 'dark' | 'system'

interface HomeProps {
  themeMode: ThemeMode
  setThemeMode: (value: ThemeMode) => void
  isLoggedIn: boolean
  setIsLoggedIn: (value: boolean) => void
}

export function Home({ themeMode, setThemeMode, isLoggedIn, setIsLoggedIn }: HomeProps) {
  const [keyword, setKeyword] = useState('')

  const { data: filteredTools } = useRequest(
    async () => {
      let result = tools
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase()
        result = result.filter((t) => t.name.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw))
      }
      return result
    },
    {
      refreshDeps: [keyword],
      debounceWait: 200,
    },
  )

  return (
    <div className={styles.home}>
      <GradientBackground />
      <Header themeMode={themeMode} setThemeMode={setThemeMode} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Vince Hub</h1>
          <p className={styles.heroSub}>实用工具集合，提升开发效率</p>
        </div>

        <div className={styles.toolbar}>
          <SearchBar value={keyword} onChange={setKeyword} />
        </div>

        <div className={styles.grid}>
          {filteredTools?.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} index={i} />
          ))}
          {filteredTools?.length === 0 && (
            <div className={styles.empty}>
              <p>没有找到匹配的工具</p>
            </div>
          )}
        </div>
      </main>
      <Footer name='Vince Hub' />
    </div>
  )
}
