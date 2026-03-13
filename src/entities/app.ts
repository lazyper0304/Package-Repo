export namespace AppEntity {
  export interface Item {
    /** App名称 */
    appName: string
    /** 安卓包名 */
    androidPackageName: string
    /** 鸿蒙包名 */
    harmonyPackageName?: string
    /** 图标地址 */
    iconUrl?: string
  }
}
