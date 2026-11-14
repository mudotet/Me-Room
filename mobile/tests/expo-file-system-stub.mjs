export class File {
  constructor(uri) {
    this.uri = uri;
    this.name = uri.slice(uri.lastIndexOf('/') + 1);
    this.type = ({ mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' })[this.name.split('.').at(-1).toLowerCase()];
  }

  async bytes() {
    return new Uint8Array([0x52, 0x4f, 0x4f, 0x4d]);
  }
}
