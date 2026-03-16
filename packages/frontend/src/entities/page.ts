export namespace PageEntity {
  export interface PageParam {
    current?: number
    pageSize?: number
  }

  export interface PagePagination {
    current: number
    pageSize: number
    total: number
    pages: number
  }

  export interface PageResponse<T> extends PagePagination {
    data: T[]
  }
}
