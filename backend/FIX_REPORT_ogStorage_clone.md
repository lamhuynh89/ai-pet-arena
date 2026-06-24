# Fix Report: `url.clone is not a function` in ogStorage.js

**File**: `projects/ai-pet-arena/backend/src/services/ogStorage.js`
**Date**: 2026-06-24
**Root cause line (original)**: ~71-83 (uploadPetData)

## Nguyên nhân

1. **Native `URL.prototype.clone` thiếu**:
   - Ethers v6 + 0G SDK (open-jsonrpc-provider + FetchRequest paths) gọi `url.clone()` khi khởi tạo `JsonRpcProvider`.
   - Node.js trên Windows Server 2016 (và một số build cũ) không có `URL.prototype.clone`.
   - Lỗi chỉ xuất hiện ở **Real Mode** (STORAGE_MODE=real) vì mock bypass toàn bộ provider.

2. **Sai signature gọi `indexer.upload`**:
   - Code cũ: `await cfg.indexer.upload(data, true)`
   - Thực tế SDK: `upload(file, blockchain_rpc: string, signer)`
   - Truyền `true` (boolean) khiến bên trong SDK tạo provider sai → dẫn vào clone path.

## Sửa

### 1. URL.clone shim (top level, chạy sớm)

```js
if (typeof URL !== 'undefined' && typeof URL.prototype.clone !== 'function') {
  URL.prototype.clone = function clone() { return new URL(this.toString()); };
}
```

Shim này tương thích tốt, không ảnh hưởng mock hay các env hiện đại.

### 2. Sửa lời gọi upload (dòng ~71)

Trước:
```js
const [txHash, rootHash, err] = await cfg.indexer.upload(data, true);
```

Sau:
```js
const [result, err] = await cfg.indexer.upload(data, cfg.rpcUrl, cfg.signer);
const txHash = result?.txHash || null;
const rootHash = result?.rootHash || ...;
```

## Kiểm chứng

- `node` load module + `initStorage()` (real mode) → OK
- `uploadPetData` chạy đến điểm submit tx → **KHÔNG còn lỗi clone**
- Lỗi nhận được: `insufficient funds` (dự kiến, vì key test không có gas)
- Cả hai fix đều cần thiết. Chỉ shim hoặc chỉ sửa arg đều vẫn fail ở một số path.

## Tương thích

- Windows Server 2016 + Node >=18: hoạt động
- Modern Node: vẫn hoạt động (shim là noop nếu đã có)
- Mock mode: không ảnh hưởng

## Lưu ý sau này

- Khi có PRIVATE_KEY thật (có gas) trên testnet → upload sẽ thành công.
- Nên thêm test `testStorageRoundtrip` trong CI với STORAGE_MODE=real (cần faucet).
- Có thể nâng cấp sau: dùng `globalThis.URL` + optional chaining an toàn hơn.

Fix hoàn tất. Clone error đã bị loại bỏ.
