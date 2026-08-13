# Tro choi Bai 17: Yen, ta, tan

Tro choi web gom 10 cau hoi, 3 muc do, moi cau 1 diem. Ket qua hoc sinh duoc luu tap trung tren Supabase; giao dien admin dung Supabase Auth de xem, loc, xoa va xuat CSV.

## 1. Tao Supabase project

1. Vao <https://supabase.com/dashboard>, chon **New project**.
2. Mo **SQL Editor**, dan toan bo noi dung [supabase-schema.sql](./supabase-schema.sql), sau do chon **Run**.
3. Mo **Authentication > Users > Add user** va tao tai khoan admin bang email/mat khau manh.
4. Quay lai **SQL Editor** va chay cau lenh sau, thay email bang email vua tao:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'teacher@example.com';
```

5. Mo **Project Settings > API** va ghi lai:
   - Project URL
   - Publishable key hoac legacy `anon` key

Khong dung `service_role` key trong Netlify hoac ma frontend.

## 2. Dua ma nguon len GitHub

Tao repository GitHub va dua cac tep trong thu muc nay len repository. Khong can dua thu muc `dist` len GitHub vi Netlify se tu tao lai khi deploy.

## 3. Deploy tren Netlify

1. Vao <https://app.netlify.com>, chon **Add new site > Import an existing project**.
2. Ket noi repository GitHub.
3. Netlify se doc [netlify.toml](./netlify.toml):
   - Build command: `node netlify-build.mjs`
   - Publish directory: `dist`
4. Trong **Site configuration > Environment variables**, them:
   - `SUPABASE_URL`: Project URL cua Supabase
   - `SUPABASE_ANON_KEY`: Publishable/anon key cua Supabase
5. Chon **Deploy site**.

Sau deploy, hoc sinh co the mo URL `*.netlify.app`. Ket qua se duoc ghi vao bang `game_results`. Nut **Quan tri** dung email/mat khau admin Supabase.

## 4. Nhap ngan hang 100 cau hoi bang CSV

Sau khi cap nhat phien ban co ngan hang cau hoi:

1. Chay lai toan bo [supabase-schema.sql](./supabase-schema.sql) trong Supabase SQL Editor. Script su dung `if not exists` va policy co the chay lai an toan.
2. Dang nhap trang **Quan tri** cua tro choi.
3. Chon **Tai CSV mau**.
4. Mo tep bang Excel hoac Google Sheets, them toi 100 cau hoi, sau do luu o dinh dang **CSV UTF-8**.
5. Chon **Nhap cau hoi CSV** va tai tep len.

Moi luot choi se chon ngau nhien:

- 3 cau muc 1
- 4 cau muc 2
- 3 cau muc 3

Can co it nhat so cau tren o moi muc. Neu ngan hang chua du, tro choi tu dong dung bo 10 cau mau.

### Cac cot CSV

| Cot | Noi dung |
| --- | --- |
| `level` | `1`, `2` hoac `3` |
| `type` | `mcq`, `truefalse`, `fill`, `match` hoac `drag` |
| `title` | Noi dung cau hoi |
| `options` | Mang JSON cho `mcq`/`truefalse`, vi du `["A","B","C","D"]` |
| `answer` | Chi so dap an bat dau tu `0`, chuoi dien khuyet, hoac object JSON cho noi/keo tha |
| `explanation` | Loi giai hien sau khi cham |
| `prefix`, `suffix` | Van ban truoc/sau o trong cua cau `fill` |
| `left_items`, `right_items` | Hai mang JSON cua cau `match` |
| `items`, `zones` | Mang the va mang nhom cua cau `drag` |
| `active` | `true` hoac `false` |

Khong can MCP rieng cho quy trinh nay: Supabase REST API da dong vai tro ket noi truc tiep giua trang admin va database.

## 5. Gan ten mien rieng

Trong Netlify, mo **Domain management > Add a domain**:

- Neu mua domain qua Netlify: lam theo huong dan thanh toan va DNS tu dong.
- Neu domain dang o nha cung cap khac: them domain vao Netlify, sau do cap nhat DNS theo gia tri Netlify hien thi.
- Voi subdomain nhu `toan.example.com`, thuong tao ban ghi `CNAME` tro den ten mien `*.netlify.app` cua site.
- Voi root domain nhu `example.com`, dung Netlify DNS hoac ban ghi `A/ALIAS` do Netlify cung cap.

Netlify se cap HTTPS tu dong sau khi DNS duoc xac minh.

## Chay local

Khong co cau hinh Supabase, tro choi tu dong dung `localStorage` va tai khoan thu nghiem:

```text
Email: admin@local.test
Mat khau: YenTaTan@17
```

Chay may chu tinh:

```powershell
python -m http.server 4173
```

Sau do mo <http://127.0.0.1:4173>. De thu Supabase local, dien URL/key vao `runtime-config.js`; khong commit key rieng tu. Anon/publishable key la khoa cong khai va van phai duoc bao ve boi RLS.

## Bao mat va du lieu

- Hoc sinh khong can tai khoan va chi co quyen them ket qua.
- Chi user nam trong `admin_users` moi co quyen doc/xoa ket qua.
- Rang buoc database gioi han diem 0-10, tong diem 10 va do dai ten/lop.
- Khong luu cau tra loi chi tiet, email hoc sinh hoac thong tin nhay cam.
