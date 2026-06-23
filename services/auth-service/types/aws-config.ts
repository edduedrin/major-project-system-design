export class AwsConfig {
  region: string;
  accessKey: string;
  secrectKey: string;
  bucketName: string;
  constructor(data: AwsConfig) {
    this.region = data?.region || "";
    this.accessKey = data?.accessKey || "";
    this.secrectKey = data?.secrectKey || "";
    this.bucketName = data?.bucketName || "";
  }
}
