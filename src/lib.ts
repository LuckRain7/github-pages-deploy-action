import {exportVariable, info, setFailed, setOutput} from '@actions/core'
import {ActionInterface, NodeActionInterface, Status} from './constants'
import {deploy, init} from './git'
import {configureSSH} from './ssh'
import {
  checkParameters,
  generateFolderPath,
  generateRepositoryPath,
  generateTokenType
} from './util'

/** Initializes and runs the action.
 *
 * @param {object} configuration - The action configuration.
 */
export default async function run(
  configuration: ActionInterface | NodeActionInterface
): Promise<void> {
  let status: Status = Status.RUNNING

  try {
    info(`
    GitHub Pages Deploy Action 🚀

    🚀 Getting Started Guide: https://github.com/marketplace/actions/deploy-to-github-pages
    ❓ Discussions / Q&A: https://github.com/JamesIves/github-pages-deploy-action/discussions
    🔧 Report a Bug: https://github.com/JamesIves/github-pages-deploy-action/issues

    📣 Maintained by James Ives: https://jamesiv.es
    💖 Support: https://github.com/sponsors/JamesIves`)

    info('Checking configuration and starting deployment… 🚦')

    const settings: ActionInterface = {
      ...configuration
    }

    // Defines the repository/folder paths and token types.
    // 定义存储库/文件夹路径和令牌类型。
    // Also verifies that the action has all of the required parameters.
    // 还验证操作是否具有所需的所有参数。
    settings.folderPath = generateFolderPath(settings)

    checkParameters(settings) // 参数检测 检查必需参数 token sshkey

    // 判断 ssh 登录 还是 token 登录，并拼接对应 git 地址
    settings.repositoryPath = generateRepositoryPath(settings)
    // ssh: SSH Deploy Key | token: Deploy Token | none: ...
    settings.tokenType = generateTokenType(settings)

    if (settings.sshKey) {
      // 设置 github 默认指纹
      await configureSSH(settings)
    }

    await init(settings)
    status = await deploy(settings)
  } catch (error) {
    status = Status.FAILED
    setFailed(error.message)
  } finally {
    info(
      `${
        status === Status.FAILED
          ? 'Deployment failed! ❌'
          : status === Status.SUCCESS
          ? 'Completed deployment successfully! ✅'
          : 'There is nothing to commit. Exiting early… 📭'
      }`
    )

    exportVariable('deployment_status', status)
    setOutput('deployment-status', status)
  }
}
