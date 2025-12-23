
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// [IIS Fix] 設定靜態檔案目錄
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const p = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        cb(null, p);
    },
    filename: (req, file, cb) => {
        const name = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, Date.now() + '-' + name);
    }
});
const upload = multer({ storage });

const readData = (file) => {
    try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')); } 
    catch (e) { return []; }
};
const writeData = (file, data) => fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));

const initDB = (file, data) => { if (!fs.existsSync(path.join(DATA_DIR, file))) writeData(file, data); };
initDB('users.json', [{ email: 'admin@levebio.com', password: 'password' }]);
initDB('cases.json', []);
initDB('messages.json', []);
initDB('news.json', []);
initDB('bulletins.json', []);
initDB('services.json', [
    { id: 1, title: "CBAM 輔導", subtitle: "量測計畫 + 制定節能目標", date: "2025-01-01", content: "針對歐盟碳邊境調整機制...", order: 1, icon: "img/S1.png" },
    { id: 2, title: "產品碳足跡(B2B)", subtitle: "量測計畫 + 制定節能目標", date: "2025-01-01", content: "依據 ISO 14067 標準...", order: 2, icon: "img/S2.png" }
]);

// 資料清洗：過濾掉只有 ID 但沒有內容的壞資料
const clean = (data) => {
    if (!Array.isArray(data)) return [];
    return data.filter(item => item && item.id && (item.title || item.name || item.summary));
};

const crud = (ep, db, fields=[]) => {
    app.get(`/api/${ep}`, (req, res) => res.json(clean(readData(db))));
    
    app.post(`/api/${ep}`, upload.fields(fields), (req, res) => {
        const list = readData(db);
        const { id, ...data } = req.body; // 移除前端傳來的空 ID
        const item = { id: Date.now(), ...data }; // 使用後端生成的 ID
        if(item.order) item.order = parseInt(item.order);
        
        if(req.files) {
            fields.forEach(f => {
                if(req.files[f.name]) {
                    // [IIS Fix] 回傳相對路徑 uploads/... 
                    item[f.name] = `uploads/${req.files[f.name][0].filename}`;
                    if(f.name.includes('attachment') || f.name.includes('icon')) item[f.name+'Name'] = req.files[f.name][0].originalname;
                }
            });
        }
        list.unshift(item);
        writeData(db, list);
        res.json({ success: true });
    });

    app.put(`/api/${ep}/:id`, upload.fields(fields), (req, res) => {
        const list = readData(db);
        const idx = list.findIndex(i => String(i.id) === String(req.params.id));
        if(idx !== -1) {
            const { id, ...data } = req.body;
            const up = { ...list[idx], ...data };
            if(up.order) up.order = parseInt(up.order);
            
            if(req.files) {
                fields.forEach(f => {
                    if(req.files[f.name]) {
                        up[f.name] = `uploads/${req.files[f.name][0].filename}`;
                        if(f.name.includes('attachment') || f.name.includes('icon')) up[f.name+'Name'] = req.files[f.name][0].originalname;
                    }
                });
            }
            list[idx] = up;
            writeData(db, list);
            res.json({ success: true });
        } else res.status(404).json({error:'Not found'});
    });

    app.delete(`/api/${ep}/:id`, (req, res) => {
        let list = readData(db);
        list = list.filter(i => String(i.id) !== String(req.params.id));
        writeData(db, list);
        res.json({ success: true });
    });
};

crud('services', 'services.json', [{name:'image'}, {name:'icon'}]);
crud('news', 'news.json', [{name:'image'}, {name:'attachment'}]);
crud('bulletins', 'bulletins.json', [{name:'attachment'}]);
crud('cases', 'cases.json', [{name:'image'}]); // Standardize Cases

// Messages
app.get('/api/messages', (req, res) => res.json(clean(readData('messages.json'))));
app.post('/api/messages', (req, res) => {
    const list = readData('messages.json');
    const { id, ...data } = req.body;
    list.unshift({ id: Date.now(), date: new Date().toISOString().split('T')[0], status: 'unread', ...data });
    writeData('messages.json', list);
    res.json({success:true});
});
app.delete('/api/messages/:id', (req, res) => {
    let list = readData('messages.json');
    list = list.filter(m => String(m.id) !== String(req.params.id));
    writeData('messages.json', list);
    res.json({success:true});
});

// Auth
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const u = readData('users.json').find(x => x.email === email && x.password === password);
    if(u) res.json({ success: true, token: 'mock-token', user: u.email }); 
    else res.status(401).json({ success: false });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
