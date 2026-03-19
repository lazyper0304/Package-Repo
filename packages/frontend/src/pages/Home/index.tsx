import React, { useMemo, useState } from 'react'
import styles from './index.module.less'
import { Button, Flex } from '@radix-ui/themes'
import SearchForm from './SearchForm'
import type { AppEntity } from '@/entities/app'
import API from '@/services'
import SearchResult from './SearchResult'
import { useMount, useRequest, useSetState } from 'ahooks'
import AppDetail from '@/components/AppDetail'
import type { PageEntity } from '@/entities/page'
import UploadExcel from '@/components/UploadExcel'
import HarmonyIcon from '@/components/HarmonyIcon'
import { GradientBackground } from 'react-gradient-animation'
import TypeManage from '@/components/TypeManage'
import type { AppTypeEntity } from '@/entities/appType'

type IProps = Readonly<{}>

type IState = {
  keyword: string
  apps: AppEntity.Item[]
  currentAppType?: string
  appTypes: AppTypeEntity.ListItem[]
  currentApp?: AppEntity.Item
  pagination: PageEntity.PagePagination
  open: boolean
  uploadOpen: boolean
  typeOpen: boolean
  harmonyIconOpen: boolean
}

const Home: React.FC<IProps> = () => {
  const [state, setState] = useSetState<IState>({
    keyword: '',
    apps: [],
    currentAppType: undefined,
    appTypes: [],
    currentApp: undefined,
    pagination: {
      current: 1,
      pageSize: 20,
      total: 0,
      pages: 0,
    },
    open: false,
    uploadOpen: false,
    typeOpen: false,
    harmonyIconOpen: false,
  })

  const searchAppsReq = useRequest(API.appSearch, {
    onSuccess(res) {
      setState({
        apps: res.data,
        pagination: {
          current: res.current,
          pageSize: res.pageSize,
          total: res.total,
          pages: res.pages,
        },
      })
    },
  })

  const appTypeListReq = useRequest(API.appTypeList, {
    onSuccess(res) {
      setState({
        appTypes: res?.data ? [{ type_name: '全部' }, ...res.data] : [{ type_name: '全部' }],
        currentAppType: '全部',
      })
    },
  })

  async function handleSearch(v: string) {
    setState({ keyword: v })

    searchAppsReq.run({ keyword: v, typeName: state.currentAppType })
  }

  function handleOpenAppDetail(app?: AppEntity.Item) {
    setState({ currentApp: app, open: true })
  }

  function handleOpenUpload() {
    setState({ uploadOpen: true })
  }

  function handleOpenType() {
    setState({ typeOpen: true })
  }

  function handleTypeChange(v: string) {
    setState({ currentAppType: v })

    searchAppsReq.run({ keyword: state.keyword, current: 1, typeName: v })
  }

  function handleCloseAppDetail() {
    setState({ currentApp: undefined, open: false })
  }

  function handleRefresh() {
    searchAppsReq.refresh()
  }

  function handleCloseUpload() {
    setState({ uploadOpen: false })
  }

  function handleCloseType() {
    setState({ typeOpen: false })
  }

  function handleTypeOk() {
    appTypeListReq.refresh()
  }

  function handleCloseHarmonyIcon() {
    setState({ harmonyIconOpen: false })
  }

  function handleUploadSuccess() {
    searchAppsReq.run({
      keyword: state.keyword,
      typeName: state.currentAppType,
    })
  }

  function handlePageChange(current: number) {
    searchAppsReq.run({ keyword: state.keyword, current, typeName: state.currentAppType })
  }

  const background = useMemo(
    () => (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          opacity: 0.2,
        }}
      >
        <GradientBackground
          skew={0}
          blending='overlay'
          colors={{
            background: 'blue',
            particles: ['#00897b', '#7f00ff', '#3b82f6'],
          }}
          speed={{ x: { min: 0.5, max: 0.8 }, y: { min: 0.5, max: 0.8 } }}
        />
      </div>
    ),
    [],
  )

  return (
    <>
      <div className={styles.home}>
        {background}

        <div className={styles.home__content}>
          <header className={styles.home__header}>
            <h1>Package Repo</h1>

            <div className={styles.home__functions}>
              <Button onClick={() => setState({ harmonyIconOpen: true })}>转鸿蒙双层图标</Button>
            </div>
          </header>

          <section>
            <Flex direction='column' gap='3' style={{ height: '100%' }}>
              <SearchForm onChange={handleSearch} />

              <SearchResult
                currentAppType={state.currentAppType}
                appTypes={state.appTypes}
                loading={searchAppsReq.loading}
                keyword={state.keyword}
                pagination={state.pagination}
                apps={state.apps}
                onClick={handleOpenAppDetail}
                onChange={handlePageChange}
                onUpload={handleOpenUpload}
                onType={handleOpenType}
                onTypeChange={handleTypeChange}
              />
            </Flex>
          </section>
        </div>
      </div>

      {state.open && (
        <AppDetail open={state.open} app={state.currentApp} onClose={handleCloseAppDetail} onRefresh={handleRefresh} />
      )}

      {state.uploadOpen && (
        <UploadExcel open={state.uploadOpen} onClose={handleCloseUpload} onUpload={handleUploadSuccess} />
      )}

      {state.typeOpen && <TypeManage open={state.typeOpen} onOk={handleTypeOk} onClose={handleCloseType} />}

      {state.harmonyIconOpen && <HarmonyIcon open={state.harmonyIconOpen} onClose={handleCloseHarmonyIcon} />}
    </>
  )
}

export default React.memo(Home)
