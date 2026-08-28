import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';

@Injectable()
export class ImageKitService {
  getAuthParameters() {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY ?? '';
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY ?? '';
    const expires = Math.floor(Date.now() / 1000) + 600;
    const token = randomBytes(16).toString('hex');
    const signature = createHmac('sha256', privateKey)
      .update(`${token}${expires}`)
      .digest('hex');

    return {
      token,
      expires,
      signature,
      publicKey,
    };
  }

  getSignedUrl(path: string) {
    const endpoint = process.env.IMAGEKIT_URL_ENDPOINT ?? '';
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY ?? '';
    if (!endpoint || !privateKey) {
      return path;
    }

    const expires = Math.floor(Date.now() / 1000) + 3600;
    let normalizedPath = path;

    if (path.startsWith(endpoint)) {
      normalizedPath = path.slice(endpoint.length);
      if (normalizedPath.startsWith('/')) {
        normalizedPath = normalizedPath.slice(1);
      }
    }

    const signature = createHmac('sha256', privateKey)
      .update(`${normalizedPath}${expires}`)
      .digest('hex');

    return `${endpoint}/${normalizedPath}?ik-t=${expires}&ik-s=${signature}`;
  }
}
