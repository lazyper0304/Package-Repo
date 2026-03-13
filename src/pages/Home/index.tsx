import React from 'react'
import styles from './index.module.less'

type IProps = Readonly<{}>

const Home: React.FC<IProps> = () => {
  return (
    <>
      <div className={styles.home}>
        <div className={styles.home__content}>
          <header className={styles.home__header}>
            <h1>Package Repo</h1>

            <div className={styles.home__functions}>
              {/* <Button variant='contained'>图标大小转换</Button>
              <Button variant='contained'>转鸿蒙双层图标</Button>
              <Button variant='contained'>管理</Button> */}
            </div>
          </header>
        </div>
      </div>
    </>
  )
}

export default React.memo(Home)
