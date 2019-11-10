import * as core from "@actions/core";
import { cp, rmRF } from "@actions/io";
import { execute } from "./util";
import { workspace, action, repositoryPath } from "./constants";

/** Generates the branch if it doesn't exist on the remote.
 * @returns {Promise}
 */
export async function init(): Promise<any> {
  try {
    if (!action.accessToken && !action.gitHubToken) {
      return core.setFailed(
        "You must provide the action with either a Personal Access Token or the GitHub Token secret in order to deploy."
      );
    }

    /*if (action.build.startsWith("/") || action.build.startsWith("./")) {
      return core.setFailed(
        `The deployment folder cannot be prefixed with '/' or './'. Instead reference the folder name directly.`
      );
    }*/

    await execute(`git init`, action.build);
    await execute(`git config user.name ${action.pusher.name}`, action.build);
    await execute(`git config user.email ${action.pusher.email}`, action.build);
  } catch (error) {
    core.setFailed(`There was an error initializing the repository: ${error}`);
  } finally {
    return Promise.resolve("Initialization step complete...");
  }
}

/** Generates the branch if it doesn't exist on the remote.
 * @returns {Promise}
 */
export async function generateBranch(): Promise<any> {
  try {
    console.log(`Creating ${action.branch} branch...`);
    await execute(`git switch ${action.baseBranch || "master"}`, workspace);
    await execute(`git switch --orphan ${action.branch}`, workspace);
    await execute(`git reset --hard`, workspace);
    await execute(
      `git commit --allow-empty -m "Initial ${action.branch} commit."`,
      workspace
    );
    await execute(`git push ${repositoryPath} ${action.branch}`, workspace);

    // Switches back to the base branch.
    await execute(`git switch ${action.baseBranch || "master"}`, workspace);
  } catch (error) {
    core.setFailed(
      `There was an error creating the deployment branch: ${error}`
    );
  } finally {
    return Promise.resolve("Deployment branch creation step complete...");
  }
}

/** Runs the necessary steps to make the deployment.
 * @returns {Promise}
 */
export async function deploy(): Promise<any> {
  /*
      Checks to see if the remote exists prior to deploying.
      If the branch doesn't exist it gets created here as an orphan.
  
  const branchExists = await execute(
    `git ls-remote --heads ${repositoryPath} ${action.branch} | wc -l`,
    workspace
  );
  if (!branchExists) {
    console.log("Deployment branch does not exist. Creating....");
    //await generateBranch();
  }*/


  console.log('list', await execute(`ls`, action.build))

  await execute(`git add --all`, action.build);
  await execute(
    `git commit -m "Deploying to ${action.branch} from ${action.baseBranch} ${process.env.GITHUB_SHA}" --quiet`,
    action.build
  );

  await execute(
    `git push --force ${repositoryPath} ${action.baseBranch}:${action.branch}`,
    action.build
  );

  return Promise.resolve("Commit step complete...");
}
