export const checkEnvVariables = (envVariables: string[]) => {
  for (let envVariable of envVariables) {
    if (!process.env[envVariable]) {
      throw new Error(`${envVariable} must be defined for ${process.env.SERVICE_NAME}`);
    }
  }
};
