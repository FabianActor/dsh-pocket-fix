// 抽屉点击规则的判定常量与纯函数 —— 抽成独立 ESM 模块，好让 node 测试直接
// 引入（client 侧是 esbuild 打进 bundle 的，测试里没有 DOM 可用）。

/**
 * 抽屉本体：被拉成抽屉的侧边栏列。
 *
 * 按类名后缀找，不按位置找。DSH 0.2.2-rc.1 的 AppFrame 在 <768px 会往 frame
 * 开头插一个 `div[data-sidebar-mask]`，`> :first-child` 于是落在遮罩上 —— 与
 * CSS 那边同一处错位，一起改成类名后缀（issue #208）。前缀哈希每次构建都变，
 * 只认 `sidebarCol` 这段。
 * @type {string}
 */
export const DRAWER_SELECTOR = '[data-mobile-nav="frame"] > [class*="sidebarCol"]'

/**
 * 抽屉开关：会话头部那颗按钮，外加 0.2.2-rc.1 自带的官方开合按钮
 * (`button[data-sidebar-opener]`)。两处都调 toggleSidebar()，不豁免的话
 * "点抽屉外就关" 会再补一下，结果开了立刻又关。
 */
export const TOGGLE_SELECTOR = '[data-mobile-nav="toggle"], [data-sidebar-opener]'

/**
 * 命中即视为导航的行：点它们要把屏幕让给刚打开的内容，所以顺带关抽屉。
 *
 * 类名现状（2026-08，侧边栏 qDHVXG_* / YDXeBa_* 这一代）：
 * - `YDXeBa_sessionRow`  会话行 —— 命中 [class*="sessionRow"]
 * - `YDXeBa_projectRow`  工作区行 —— **故意不收**：实测它是折叠/展开开关
 *   （aria-expanded 来回翻，会话列表显隐），不是导航。收进来会让每次展开
 *   工作区都把抽屉关掉（issue #72）。
 * 旧一代侧边栏的 `_searchResultWorkspace_` / `_searchResultRow_` 保留，兼容
 * 尚未升级的宿主。
 *
 * @type {string}
 */
export const NAV_TARGETS = [
  'button[data-dsh-taskboard-entry]',
  'button[data-dsh-ssh-entry]',
  // 抽屉底部的 "文件" 入口打开的是 dsh-web-ui 的 explorer 面板，它的 z-index
  // (55) 低于展开的抽屉 (600)，且在抽屉 DOM 之外：抽屉不关就会盖住面板，点
  // 面板里的行又会被"点抽屉外就关"吃掉。所以按导航处理，一起关掉。
  '[data-mobile-nav="files"]',
  '[class*="sessionRow"]',
  '[class*="newSession"]',
  '[class*="searchResultWorkspace"]',
  '[class*="searchResultRow"]',
].join(', ')

/**
 * 行内操作按钮（会话行的 kebab：重命名 / 删除）——点开的是菜单不是内容，
 * 不能按导航处理，否则抽屉一关，刚弹出的菜单跟着没了。
 * @type {string}
 */
export const NAV_EXCLUDE = '[class*="sessionRow"] button'

/**
 * 浮层（portal 到 body 的下拉菜单 / 弹窗）。
 *
 * 抽屉里的控件（工作区区块的"视图选项"、"添加工作区"，会话行的 kebab…）
 * 弹出的菜单在 DOM 上属于 body，不在抽屉里。"点抽屉外就关"因此会把菜单项
 * 的第一下点击吃掉：抽屉先滑走 → 菜单随侧边栏卸载 → 菜单项的 onClick 永远
 * 不执行。手机上表现就是工作区相关菜单"点了没反应"（issue #72）。
 *
 * 落在浮层内的点击一律豁免，交给浮层自己收尾。
 *
 * @type {string}
 */
export const OVERLAY_SELECTOR = [
  '[role="menu"]',
  '[role="listbox"]',
  '[role="dialog"]',
  '[role="tooltip"]',
  '[data-radix-popper-content-wrapper]',
].join(', ')

/**
 * 抽屉内一次点击是否算导航（应关抽屉）。命中 NAV_EXCLUDE 的行内按钮不算。
 * @param {Element | null | undefined} target - 点击目标。
 * @returns {Element | null} 命中的导航行，未命中返回 null。
 */
export function navTargetFor(target) {
  if (target == null || typeof target.closest !== 'function') return null
  if (target.closest(NAV_EXCLUDE) !== null) return null
  return target.closest(NAV_TARGETS)
}

/**
 * 一次点击是否落在浮层内（浮层自己会关闭，不该由抽屉规则接管）。
 * @param {Element | null | undefined} target - 点击目标。
 * @returns {boolean}
 */
export function isOverlayTap(target) {
  if (target == null || typeof target.closest !== 'function') return false
  return target.closest(OVERLAY_SELECTOR) !== null
}
