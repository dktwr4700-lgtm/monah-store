# مسودة تقوية قواعد Firebase لموقع مُونَة

> **هذه مسودة للمراجعة فقط. لا تُنسخ إلى Firebase Console ولا يُضغط Publish قبل تنفيذ تعديلات التوافق في الموقع واختبارها محليًا.**

## ما الذي ستحققه المسودة

تمنع المسودة البائع من تغيير موارد بائع آخر، وتغلق مجموعة `shared` غير المستخدمة، وتمنع إنشاء الطلبات وتصاريح التنزيل من المتصفح. كما تجعل الأكواد الخاصة بالمنتجات مقروءة لصاحب المنتج فقط، وتضيف قاعدة `coupons` التي تحتاجها ميزة الكوبونات الحالية.

تتطلب لوحة الإدارة تنفيذ **Custom Claim** باسم `admin: true` على حساب المالك من خادم موثوق قبل النشر. لا يكفي التحقق من البريد داخل واجهة المتصفح.

## قواعد Firestore المقترحة

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn() && request.auth.token.admin == true;
    }

    function owns(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    function ownsProduct() {
      return signedIn() && resource.data.ownerId == request.auth.uid;
    }

    function productIsPublic() {
      return resource.data.get('hidden', true) == false
        && resource.data.get('suspended', false) == false;
    }

    function sellerIsEligibleForCoupons() {
      return signedIn()
        && get(/databases/$(database)/documents/sellers/$(request.auth.uid)).data.plan in ['pro', 'full'];
    }

    match /shared/{docId} {
      allow read, write: if false;
    }

    match /products/{productId} {
      allow get: if productIsPublic() || ownsProduct() || isAdmin();
      allow list: if productIsPublic() || ownsProduct() || isAdmin();

      allow create: if signedIn()
        && request.resource.data.ownerId == request.auth.uid
        && request.resource.data.hidden == true
        && request.resource.data.price is number
        && request.resource.data.price > 0
        && request.resource.data.keys().hasOnly([
          'ownerId', 'name', 'price', 'description', 'category', 'type',
          'filePath', 'codesCount', 'images', 'hidden', 'createdAt'
        ]);

      allow update: if isAdmin() || (
        ownsProduct()
        && request.resource.data.ownerId == resource.data.ownerId
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'name', 'price', 'description', 'category', 'filePath',
          'codesCount', 'images', 'hidden'
        ])
      );

      allow delete: if ownsProduct() || isAdmin();

      match /codes/{codeId} {
        allow get, list: if ownsProduct() || isAdmin();
        allow create: if ownsProduct()
          && request.resource.data.keys().hasOnly(['code', 'used', 'usedBy', 'usedAt'])
          && request.resource.data.used == false
          && request.resource.data.usedBy == null
          && request.resource.data.usedAt == null;
        allow update, delete: if isAdmin();
      }
    }

    match /stores/{ownerId} {
      allow read: if true;
      allow create: if owns(ownerId)
        && request.resource.data.ownerId == request.auth.uid
        && request.resource.data.keys().hasOnly([
          'ownerId', 'name', 'color', 'tagline', 'whatsapp', 'instagram',
          'slug', 'logoUrl', 'coverUrl', 'updatedAt'
        ]);
      allow update: if owns(ownerId)
        && request.resource.data.ownerId == resource.data.ownerId
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'name', 'color', 'tagline', 'whatsapp', 'instagram', 'slug',
          'logoUrl', 'coverUrl', 'updatedAt'
        ]);
      allow delete: if owns(ownerId) || isAdmin();
    }

    match /sellers/{sellerId} {
      allow get: if owns(sellerId) || isAdmin();
      allow list: if isAdmin();
      allow create: if owns(sellerId)
        && request.resource.data.email == request.auth.token.email
        && request.resource.data.keys().hasOnly(['storeName', 'email', 'createdAt', 'plan']);
      allow update: if owns(sellerId)
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['storeName'])
        || isAdmin();
      allow delete: if isAdmin();
    }

    match /coupons/{couponId} {
      allow get, list: if signedIn() && resource.data.ownerId == request.auth.uid || isAdmin();
      allow create: if sellerIsEligibleForCoupons()
        && request.resource.data.ownerId == request.auth.uid
        && request.resource.data.active == true
        && request.resource.data.discountPercent is number
        && request.resource.data.discountPercent > 0
        && request.resource.data.discountPercent <= 90
        && request.resource.data.keys().hasOnly([
          'ownerId', 'code', 'discountPercent', 'productId', 'active', 'createdAt'
        ]);
      allow update: if signedIn() && resource.data.ownerId == request.auth.uid
        && request.resource.data.ownerId == resource.data.ownerId;
      allow delete: if signedIn() && resource.data.ownerId == request.auth.uid || isAdmin();
    }

    // يُنشر هذا الجزء فقط عند تجهيز ثواني ونقل إنشاء الطلب وتأكيد الدفع إلى الخادم.
    match /orders/{orderId} {
      allow get, list: if signedIn() && resource.data.ownerId == request.auth.uid || isAdmin();
      allow create, update, delete: if false;
    }

    // يُنشر هذا الجزء مع endpoint ثواني الموثوق الذي ينشئ تصريح التنزيل.
    match /unlocks/{unlockId} {
      allow get: if signedIn() && resource.data.uid == request.auth.uid || isAdmin();
      allow list: if false;
      allow create, update, delete: if false;
    }
  }
}
```

## قواعد Storage المقترحة

```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function signedIn() {
      return request.auth != null;
    }

    function isProductOwner(productId) {
      return signedIn()
        && firestore.exists(/databases/(default)/documents/products/$(productId))
        && firestore.get(/databases/(default)/documents/products/$(productId)).data.ownerId == request.auth.uid;
    }

    function hasValidUnlock(productId) {
      return signedIn()
        && firestore.exists(/databases/(default)/documents/unlocks/$(request.auth.uid + '_' + productId))
        && firestore.get(/databases/(default)/documents/unlocks/$(request.auth.uid + '_' + productId)).data.expiresAt > request.time;
    }

    function isOwnerNamedFile(fileName) {
      return signedIn() && fileName.matches(request.auth.uid + '-.*');
    }

    match /secure/{productId}/{fileName} {
      allow read: if isProductOwner(productId) || hasValidUnlock(productId);
      allow create: if isProductOwner(productId)
        && request.resource.size < 50 * 1024 * 1024;
      allow update, delete: if false;
    }

    match /product-images/{fileName} {
      allow read: if true;
      allow create: if isOwnerNamedFile(fileName)
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
      allow update, delete: if isOwnerNamedFile(fileName);
    }

    match /logos/{fileName} {
      allow read: if true;
      allow create: if isOwnerNamedFile(fileName)
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
      allow update, delete: if isOwnerNamedFile(fileName);
    }

    match /covers/{fileName} {
      allow read: if true;
      allow create: if isOwnerNamedFile(fileName)
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
      allow update, delete: if isOwnerNamedFile(fileName);
    }
  }
}
```

## تعديلات التوافق المطلوبة قبل التطبيق

قواعد Firestore المقترحة ستمنع حفظ إعداد التصميم الحالي، لأنه يكتب حقول الدفع اليدوي داخل مستند `stores` العام. وبما أن الدفع مؤجل، يجب إزالة هذه الحقول من الحفظ أو نقلها لاحقًا إلى مستند خاص قبل تطبيق القواعد. كما يجب تعديل استعلام المتجر العام ليطلب المنتجات المنشورة وغير الموقوفة من قاعدة البيانات نفسها، لا أن يخفيها بعد تحميلها. وأخيرًا، يجب إعداد Custom Claim للإدارة من خادم موثوق قبل إغلاق صلاحية الإدارة على قواعد المستخدم.

لا تُطبّق هذه المسودة منفردة؛ تُنفذ كتحديث واحد متوافق: تعديل الواجهة والخادم، اختبار محلي، معاينة، ثم موافقة منفصلة منك على نشر قواعد Firebase. تبقى قواعد `orders` و`unlocks` في مرحلة ثواني حتى لا نغيّر أي تدفق دفع قبل جاهزيته.
