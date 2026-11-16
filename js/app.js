(function (globalScope) {
  'use strict';

  var STORAGE_KEY = 'ccs10_proposal_state';
  var SCHEMA_VERSION = 3;
  var memoryFallbackState = null;
  var storageRestricted = false;

  var PART_CATEGORIES = [
    { id: 'cpu', selectId: 'part-cpu', label: 'Processor' },
    { id: 'cooler', selectId: 'part-cooler', label: 'Cooler' },
    { id: 'mobo', selectId: 'part-mobo', label: 'Motherboard' },
    { id: 'ram', selectId: 'part-ram', label: 'Memory' },
    { id: 'ssd', selectId: 'part-ssd', label: 'Primary SSD' },
    { id: 'storage2', selectId: 'part-storage2', label: '2nd Storage', defaultId: 'none' },
    { id: 'gpu', selectId: 'part-gpu', label: 'Graphics' },
    { id: 'psu', selectId: 'part-psu', label: 'Power Supply' },
    { id: 'pcCase', selectId: 'part-case', label: 'Case' },
    { id: 'fans', selectId: 'part-fans', label: 'Fans & Paste', defaultId: 'stock-fans' },
    { id: 'wifi', selectId: 'part-wifi', label: 'Network / Wi-Fi', defaultId: 'onboard-net' },
    { id: 'os', selectId: 'part-os', label: 'OS & Software', defaultId: 'win11-trial' }
  ];

  var PROPOSAL_CATALOG = {
    assemblyFeePhp: 2500,
    parts: {
      cpu: {
        'r5-5500': { id: 'r5-5500', name: 'AMD Ryzen 5 5500 (6-Core, 4.2 GHz, AM4)', shortName: 'Ryzen 5 5500', pricePhp: 5200 },
        'r5-5600': { id: 'r5-5600', name: 'AMD Ryzen 5 5600 (6-Core, 4.4 GHz, AM4)', shortName: 'Ryzen 5 5600', pricePhp: 6500 },
        'r5-5600x': { id: 'r5-5600x', name: 'AMD Ryzen 5 5600X (6-Core, 4.6 GHz, AM4)', shortName: 'Ryzen 5 5600X', pricePhp: 7400 },
        'r7-5700x': { id: 'r7-5700x', name: 'AMD Ryzen 7 5700X (8-Core, 4.6 GHz, AM4)', shortName: 'Ryzen 7 5700X', pricePhp: 9200 },
        'r7-5700x3d': { id: 'r7-5700x3d', name: 'AMD Ryzen 7 5700X3D (8-Core, 3D V-Cache, AM4)', shortName: 'Ryzen 7 5700X3D', pricePhp: 12200 },
        'r5-7500f': { id: 'r5-7500f', name: 'AMD Ryzen 5 7500F (6-Core, 5.0 GHz, AM5)', shortName: 'Ryzen 5 7500F', pricePhp: 9200 },
        'r5-7600': { id: 'r5-7600', name: 'AMD Ryzen 5 7600 (6-Core, 5.1 GHz, AM5)', shortName: 'Ryzen 5 7600', pricePhp: 10500 },
        'r5-9600x': { id: 'r5-9600x', name: 'AMD Ryzen 5 9600X (6-Core, 5.4 GHz, AM5)', shortName: 'Ryzen 5 9600X', pricePhp: 13800 },
        'r7-7700': { id: 'r7-7700', name: 'AMD Ryzen 7 7700 (8-Core, 5.3 GHz, AM5)', shortName: 'Ryzen 7 7700', pricePhp: 12500 },
        'r7-9700x': { id: 'r7-9700x', name: 'AMD Ryzen 7 9700X (8-Core, 5.5 GHz, AM5)', shortName: 'Ryzen 7 9700X', pricePhp: 18500 },
        'r7-7800x3d': { id: 'r7-7800x3d', name: 'AMD Ryzen 7 7800X3D (8-Core, 3D V-Cache, AM5)', shortName: 'Ryzen 7 7800X3D', pricePhp: 23500 },
        'r7-9800x3d': { id: 'r7-9800x3d', name: 'AMD Ryzen 7 9800X3D (8-Core, Zen 5 3D V-Cache, AM5)', shortName: 'Ryzen 7 9800X3D', pricePhp: 28500 },
        'r9-7900x': { id: 'r9-7900x', name: 'AMD Ryzen 9 7900X (12-Core, 5.6 GHz, AM5)', shortName: 'Ryzen 9 7900X', pricePhp: 19500 },
        'r9-9900x': { id: 'r9-9900x', name: 'AMD Ryzen 9 9900X (12-Core, 5.6 GHz, AM5)', shortName: 'Ryzen 9 9900X', pricePhp: 24800 },
        'r9-7950x': { id: 'r9-7950x', name: 'AMD Ryzen 9 7950X (16-Core, 5.7 GHz, AM5)', shortName: 'Ryzen 9 7950X', pricePhp: 29500 },
        'r9-9950x': { id: 'r9-9950x', name: 'AMD Ryzen 9 9950X (16-Core, 5.7 GHz, AM5)', shortName: 'Ryzen 9 9950X', pricePhp: 36500 },
        'i3-14100f': { id: 'i3-14100f', name: 'Intel Core i3-14100F (4-Core, 4.7 GHz, LGA1700)', shortName: 'Core i3-14100F', pricePhp: 6200 },
        'i5-12400f': { id: 'i5-12400f', name: 'Intel Core i5-12400F (6-Core, 4.4 GHz, LGA1700)', shortName: 'Core i5-12400F', pricePhp: 6800 },
        'i5-13400f': { id: 'i5-13400f', name: 'Intel Core i5-13400F (10-Core, 4.6 GHz, LGA1700)', shortName: 'Core i5-13400F', pricePhp: 9800 },
        'i5-14400f': { id: 'i5-14400f', name: 'Intel Core i5-14400F (10-Core, 4.7 GHz, LGA1700)', shortName: 'Core i5-14400F', pricePhp: 11200 },
        'i5-14600k': { id: 'i5-14600k', name: 'Intel Core i5-14600K (14-Core, 5.3 GHz, LGA1700)', shortName: 'Core i5-14600K', pricePhp: 15500 },
        'i7-14700k': { id: 'i7-14700k', name: 'Intel Core i7-14700K (20-Core, 5.6 GHz, LGA1700)', shortName: 'Core i7-14700K', pricePhp: 22900 },
        'ultra7-265k': { id: 'ultra7-265k', name: 'Intel Core Ultra 7 265K (20-Core, 5.5 GHz, LGA1851)', shortName: 'Core Ultra 7 265K', pricePhp: 24500 },
        'i9-14900k': { id: 'i9-14900k', name: 'Intel Core i9-14900K (24-Core, 6.0 GHz, LGA1700)', shortName: 'Core i9-14900K', pricePhp: 33500 }
      },
      cooler: {
        'id-se214-xt': { id: 'id-se214-xt', name: 'ID-Cooling SE-214-XT 120mm Single-Tower Air Cooler', shortName: 'ID-Cooling SE-214-XT', pricePhp: 950 },
        'deepcool-ak400': { id: 'deepcool-ak400', name: 'DeepCool AK400 120mm Air Cooler', shortName: 'DeepCool AK400', pricePhp: 1300 },
        'arctic-f36': { id: 'arctic-f36', name: 'Arctic Freezer 36 Black Dual-Fan Air Cooler', shortName: 'Arctic Freezer 36', pricePhp: 1650 },
        'thermalright-pa120': { id: 'thermalright-pa120', name: 'Thermalright Peerless Assassin 120 SE Dual-Tower', shortName: 'Peerless Assassin 120 SE', pricePhp: 1900 },
        'thermalright-ps120': { id: 'thermalright-ps120', name: 'Thermalright Phantom Spirit 120 SE 7-Heatpipe', shortName: 'Phantom Spirit 120 SE', pricePhp: 2250 },
        'scythe-fuma3': { id: 'scythe-fuma3', name: 'Scythe Fuma 3 Asymmetric Dual-Tower Air Cooler', shortName: 'Scythe Fuma 3', pricePhp: 2950 },
        'deepcool-ak620': { id: 'deepcool-ak620', name: 'DeepCool AK620 Digital Dual-Tower Air Cooler', shortName: 'DeepCool AK620', pricePhp: 3500 },
        'bequiet-drp5': { id: 'bequiet-drp5', name: 'be quiet! Dark Rock Pro 5 Dual-Tower Air Cooler', shortName: 'Dark Rock Pro 5', pricePhp: 5400 },
        'noctua-nhd15-g2': { id: 'noctua-nhd15-g2', name: 'Noctua NH-D15 G2 Chromax Workstation Air Cooler', shortName: 'Noctua NH-D15 G2', pricePhp: 7200 },
        'deepcool-le520': { id: 'deepcool-le520', name: 'DeepCool LE520 240mm AIO Liquid Cooler', shortName: 'DeepCool LE520 240', pricePhp: 3200 },
        'arctic-lf3-240': { id: 'arctic-lf3-240', name: 'Arctic Liquid Freezer III 240mm Liquid Cooler', shortName: 'Arctic LF III 240', pricePhp: 4200 },
        'arctic-lf3-360': { id: 'arctic-lf3-360', name: 'Arctic Liquid Freezer III 360mm High-Static AIO', shortName: 'Arctic LF III 360', pricePhp: 5600 },
        'lianli-galahad-360': { id: 'lianli-galahad-360', name: 'Lian Li Galahad II Trinity 360mm Liquid Cooler', shortName: 'Lian Li Galahad II 360', pricePhp: 7800 },
        'nzxt-kraken-360': { id: 'nzxt-kraken-360', name: 'NZXT Kraken 360 LCD Display Liquid Cooler', shortName: 'NZXT Kraken 360 LCD', pricePhp: 9800 }
      },
      mobo: {
        'asrock-b550m-pro4': { id: 'asrock-b550m-pro4', name: 'ASRock B550M Pro4 (AM4, DDR4, Dual M.2)', shortName: 'ASRock B550M Pro4', pricePhp: 4800 },
        'msi-b550m-vdh': { id: 'msi-b550m-vdh', name: 'MSI B550M PRO-VDH WiFi (AM4, DDR4)', shortName: 'MSI B550M PRO-VDH WiFi', pricePhp: 5400 },
        'asus-tuf-b550m': { id: 'asus-tuf-b550m', name: 'ASUS TUF Gaming B550M-Plus WiFi II (AM4, DDR4)', shortName: 'ASUS TUF B550M WiFi', pricePhp: 6900 },
        'msi-b760m-bomber': { id: 'msi-b760m-bomber', name: 'MSI B760M Bomber WiFi DDR4 (LGA1700)', shortName: 'MSI B760M Bomber', pricePhp: 6100 },
        'gigabyte-b760m-ds3h': { id: 'gigabyte-b760m-ds3h', name: 'Gigabyte B760M DS3H AX DDR5 (LGA1700)', shortName: 'Gigabyte B760M AX', pricePhp: 7400 },
        'msi-b760-tomahawk': { id: 'msi-b760-tomahawk', name: 'MSI MAG B760 Tomahawk WiFi DDR5 (LGA1700)', shortName: 'MSI B760 Tomahawk', pricePhp: 10400 },
        'asus-z790p-wifi': { id: 'asus-z790p-wifi', name: 'ASUS Prime Z790-P WiFi DDR5 (LGA1700)', shortName: 'ASUS Z790-P WiFi', pricePhp: 12200 },
        'msi-z790-tomahawk': { id: 'msi-z790-tomahawk', name: 'MSI MAG Z790 Tomahawk Max WiFi 7 (LGA1700)', shortName: 'MSI Z790 Tomahawk Max', pricePhp: 15800 },
        'msi-z890-pro': { id: 'msi-z890-pro', name: 'MSI PRO Z890-P WiFi DDR5 (LGA1851)', shortName: 'MSI PRO Z890-P WiFi', pricePhp: 13500 },
        'msi-b650m-p': { id: 'msi-b650m-p', name: 'MSI PRO B650M-P DDR5 (AM5)', shortName: 'MSI PRO B650M-P', pricePhp: 6200 },
        'asrock-b650m-hdv': { id: 'asrock-b650m-hdv', name: 'ASRock B650M-HDV/M.2 DDR5 (AM5)', shortName: 'ASRock B650M-HDV', pricePhp: 6800 },
        'gigabyte-b650m-aorus': { id: 'gigabyte-b650m-aorus', name: 'Gigabyte B650M AORUS Elite AX WiFi (AM5)', shortName: 'Gigabyte B650M AORUS', pricePhp: 8500 },
        'asrock-b650m-riptide': { id: 'asrock-b650m-riptide', name: 'ASRock B650M PG Riptide WiFi DDR5 (AM5)', shortName: 'ASRock B650M Riptide', pricePhp: 8900 },
        'asus-tuf-b650': { id: 'asus-tuf-b650', name: 'ASUS TUF Gaming B650-Plus WiFi (AM5)', shortName: 'ASUS TUF B650-Plus WiFi', pricePhp: 9200 },
        'msi-b650-tomahawk': { id: 'msi-b650-tomahawk', name: 'MSI MAG B650 Tomahawk WiFi (AM5, 2.5GbE)', shortName: 'MSI B650 Tomahawk', pricePhp: 11200 },
        'gigabyte-x670e-pro': { id: 'gigabyte-x670e-pro', name: 'Gigabyte X670E AORUS Pro X PCIe 5.0 (AM5)', shortName: 'Gigabyte X670E Pro X', pricePhp: 16500 },
        'asus-proart-x870e': { id: 'asus-proart-x870e', name: 'ASUS ProArt X870E-Creator WiFi 7 Dual 10GbE (AM5)', shortName: 'ASUS ProArt X870E', pricePhp: 26500 }
      },
      ram: {
        'kingston-16gb-d4': { id: 'kingston-16gb-d4', name: 'Kingston Fury Beast 16GB (2x8GB) DDR4-3200 CL16', shortName: '16GB DDR4', pricePhp: 2300 },
        'team-16gb-d4': { id: 'team-16gb-d4', name: 'TeamGroup T-Force Vulcan Z 16GB (2x8GB) DDR4-3600', shortName: '16GB DDR4-3600', pricePhp: 2450 },
        'kingston-32gb-d4': { id: 'kingston-32gb-d4', name: 'Kingston Fury Beast 32GB (2x16GB) DDR4-3600', shortName: '32GB DDR4', pricePhp: 3800 },
        'corsair-32gb-d4': { id: 'corsair-32gb-d4', name: 'Corsair Vengeance LPX 32GB (2x16GB) DDR4-3600', shortName: 'Corsair 32GB DDR4', pricePhp: 4100 },
        'gskill-64gb-d4': { id: 'gskill-64gb-d4', name: 'G.Skill Ripjaws V 64GB (2x32GB) DDR4-3600', shortName: '64GB DDR4', pricePhp: 7400 },
        'crucial-16gb-d5': { id: 'crucial-16gb-d5', name: 'Crucial Pro 16GB (2x8GB) DDR5-5600 UDIMM', shortName: '16GB DDR5', pricePhp: 3400 },
        'kingston-32gb-d5': { id: 'kingston-32gb-d5', name: 'Kingston Fury Beast 32GB (2x16GB) DDR5-6000', shortName: '32GB DDR5', pricePhp: 6200 },
        'team-create-32gb-d5': { id: 'team-create-32gb-d5', name: 'TeamGroup T-Create Expert 32GB (2x16GB) DDR5-6000 CL30', shortName: 'T-Create 32GB DDR5', pricePhp: 6600 },
        'lexar-ares-32gb-d5': { id: 'lexar-ares-32gb-d5', name: 'Lexar Ares RGB 32GB (2x16GB) DDR5-6400 CL32', shortName: 'Lexar 32GB DDR5-6400', pricePhp: 6900 },
        'gskill-64gb-d5': { id: 'gskill-64gb-d5', name: 'G.Skill Flare X5 64GB (2x32GB) DDR5-6000', shortName: '64GB DDR5', pricePhp: 9500 },
        'corsair-64gb-d5': { id: 'corsair-64gb-d5', name: 'Corsair Vengeance 64GB (2x32GB) DDR5-6000 CL30', shortName: '64GB DDR5 CL30', pricePhp: 10500 },
        'gskill-neo-64gb-d5': { id: 'gskill-neo-64gb-d5', name: 'G.Skill Trident Z5 Neo 64GB (2x32GB) DDR5-6000 EXPO', shortName: 'Trident Z5 64GB DDR5', pricePhp: 11800 },
        'corsair-96gb-d5': { id: 'corsair-96gb-d5', name: 'Corsair Vengeance 96GB (2x48GB) DDR5-6000', shortName: '96GB DDR5', pricePhp: 15500 },
        'kingston-128gb-d5': { id: 'kingston-128gb-d5', name: 'Kingston Fury Beast 128GB (4x32GB) DDR5-5600 Kit', shortName: '128GB DDR5 Kit', pricePhp: 21800 }
      },
      ssd: {
        'kingston-nv2-500g': { id: 'kingston-nv2-500g', name: 'Kingston NV2 500GB PCIe Gen4 NVMe M.2 SSD', shortName: 'Kingston NV2 500GB', pricePhp: 2100 },
        'crucial-p3p-1tb': { id: 'crucial-p3p-1tb', name: 'Crucial P3 Plus 1TB PCIe Gen4 NVMe M.2 SSD', shortName: 'Crucial P3 Plus 1TB', pricePhp: 3300 },
        'wd-sn580-1tb': { id: 'wd-sn580-1tb', name: 'WD Blue SN580 1TB NVMe Gen4 SSD', shortName: 'WD SN580 1TB', pricePhp: 3500 },
        'lexar-nm790-1tb': { id: 'lexar-nm790-1tb', name: 'Lexar NM790 1TB PCIe Gen4 NVMe (7400 MB/s)', shortName: 'Lexar NM790 1TB', pricePhp: 4100 },
        'kingston-kc3000-1tb': { id: 'kingston-kc3000-1tb', name: 'Kingston KC3000 1TB PCIe Gen4 DRAM NVMe SSD', shortName: 'Kingston KC3000 1TB', pricePhp: 4600 },
        'wd-sn850x-1tb': { id: 'wd-sn850x-1tb', name: 'WD Black SN850X 1TB PCIe Gen4 DRAM NVMe SSD', shortName: 'WD SN850X 1TB', pricePhp: 5100 },
        'samsung-990pro-1tb': { id: 'samsung-990pro-1tb', name: 'Samsung 990 PRO 1TB PCIe Gen4 NVMe SSD', shortName: 'Samsung 990 PRO 1TB', pricePhp: 5400 },
        'lexar-nm790-2tb': { id: 'lexar-nm790-2tb', name: 'Lexar NM790 2TB NVMe Gen4 SSD', shortName: 'Lexar NM790 2TB', pricePhp: 6200 },
        'crucial-t500-2tb': { id: 'crucial-t500-2tb', name: 'Crucial T500 2TB PCIe Gen4 TLC DRAM NVMe SSD', shortName: 'Crucial T500 2TB', pricePhp: 7600 },
        'wd-sn850x-2tb': { id: 'wd-sn850x-2tb', name: 'WD Black SN850X 2TB PCIe Gen4 NVMe SSD', shortName: 'WD SN850X 2TB', pricePhp: 7900 },
        'samsung-990pro-2tb': { id: 'samsung-990pro-2tb', name: 'Samsung 990 PRO 2TB NVMe Gen4 SSD', shortName: 'Samsung 990 PRO 2TB', pricePhp: 8500 },
        'seagate-530-2tb': { id: 'seagate-530-2tb', name: 'Seagate FireCuda 530 2TB High-Endurance NVMe SSD', shortName: 'FireCuda 530 2TB', pricePhp: 9200 },
        'lexar-nm790-4tb': { id: 'lexar-nm790-4tb', name: 'Lexar NM790 4TB PCIe Gen4 NVMe M.2 SSD', shortName: 'Lexar NM790 4TB', pricePhp: 12200 },
        'kingston-kc3000-4tb': { id: 'kingston-kc3000-4tb', name: 'Kingston KC3000 4TB NVMe Gen4 SSD', shortName: 'Kingston KC3000 4TB', pricePhp: 13800 },
        'samsung-990pro-4tb': { id: 'samsung-990pro-4tb', name: 'Samsung 990 PRO 4TB PCIe Gen4 NVMe SSD', shortName: 'Samsung 990 PRO 4TB', pricePhp: 16500 },
        'crucial-t700-2tb': { id: 'crucial-t700-2tb', name: 'Crucial T700 2TB PCIe Gen5 NVMe (12,400 MB/s)', shortName: 'Crucial T700 Gen5 2TB', pricePhp: 14900 }
      },
      storage2: {
        'none': { id: 'none', name: 'None — Single Primary Drive Only', shortName: 'No 2nd Drive', pricePhp: 0 },
        'team-mp33-1tb': { id: 'team-mp33-1tb', name: 'TeamGroup MP33 1TB Scratch NVMe M.2 SSD', shortName: 'Team MP33 1TB', pricePhp: 3100 },
        'crucial-mx500-1tb': { id: 'crucial-mx500-1tb', name: 'Crucial MX500 1TB 2.5" SATA Project SSD', shortName: 'Crucial MX500 1TB', pricePhp: 3800 },
        'wd-sn580-2tb-2nd': { id: 'wd-sn580-2tb-2nd', name: 'WD Blue SN580 2TB Secondary NVMe SSD', shortName: 'WD SN580 2TB (2nd)', pricePhp: 6100 },
        'lexar-nm790-2tb-2nd': { id: 'lexar-nm790-2tb-2nd', name: 'Lexar NM790 2TB Secondary Scratch NVMe SSD', shortName: 'Lexar 2TB Scratch', pricePhp: 6200 },
        'seagate-2tb-hdd': { id: 'seagate-2tb-hdd', name: 'Seagate BarraCuda 2TB 7200RPM Archive HDD', shortName: 'Seagate 2TB HDD', pricePhp: 3400 },
        'wd-blue-4tb-hdd': { id: 'wd-blue-4tb-hdd', name: 'Western Digital Blue 4TB 3.5" Archive HDD', shortName: 'WD Blue 4TB HDD', pricePhp: 5400 },
        'toshiba-x300-4tb': { id: 'toshiba-x300-4tb', name: 'Toshiba X300 4TB 7200RPM Performance HDD', shortName: 'Toshiba X300 4TB', pricePhp: 6500 },
        'seagate-ironwolf-4tb': { id: 'seagate-ironwolf-4tb', name: 'Seagate IronWolf 4TB CMR RAID Backup HDD', shortName: 'IronWolf 4TB CMR', pricePhp: 6900 },
        'seagate-ironwolf-8tb': { id: 'seagate-ironwolf-8tb', name: 'Seagate IronWolf 8TB 7200RPM Studio Archive HDD', shortName: 'IronWolf 8TB CMR', pricePhp: 11800 }
      },
      gpu: {
        'sapphire-rx-6600': { id: 'sapphire-rx-6600', name: 'Sapphire Pulse Radeon RX 6600 8GB', shortName: 'RX 6600 8GB', pricePhp: 12500 },
        'asrock-rx-7600': { id: 'asrock-rx-7600', name: 'ASRock Challenger Radeon RX 7600 8GB', shortName: 'RX 7600 8GB', pricePhp: 15400 },
        'galax-rtx-3060-12g': { id: 'galax-rtx-3060-12g', name: 'Galax GeForce RTX 3060 (1-Click OC) 12GB', shortName: 'RTX 3060 12GB', pricePhp: 15900 },
        'intel-arc-b580': { id: 'intel-arc-b580', name: 'Intel Arc B580 Limited Edition 12GB GDDR6', shortName: 'Arc B580 12GB', pricePhp: 16200 },
        'asus-rtx-4060': { id: 'asus-rtx-4060', name: 'ASUS Dual GeForce RTX 4060 OC 8GB', shortName: 'RTX 4060 8GB', pricePhp: 16200 },
        'msi-rtx-4060-ventus': { id: 'msi-rtx-4060-ventus', name: 'MSI Ventus 2X Black GeForce RTX 4060 8GB', shortName: 'MSI RTX 4060 8GB', pricePhp: 16800 },
        'gigabyte-rtx-4060-aero': { id: 'gigabyte-rtx-4060-aero', name: 'Gigabyte GeForce RTX 4060 AERO OC 8GB White', shortName: 'RTX 4060 AERO 8GB', pricePhp: 18500 },
        'zotac-rtx-4060ti': { id: 'zotac-rtx-4060ti', name: 'Zotac GeForce RTX 4060 Ti Twin Edge 8GB', shortName: 'RTX 4060 Ti 8GB', pricePhp: 16500 },
        'sapphire-rx-7700xt': { id: 'sapphire-rx-7700xt', name: 'Sapphire Pulse Radeon RX 7700 XT 12GB', shortName: 'RX 7700 XT 12GB', pricePhp: 24500 },
        'msi-rtx-4060ti-16g': { id: 'msi-rtx-4060ti-16g', name: 'MSI Ventus 2X GeForce RTX 4060 Ti 16GB VRAM', shortName: 'RTX 4060 Ti 16GB', pricePhp: 26800 },
        'sapphire-rx-7800xt': { id: 'sapphire-rx-7800xt', name: 'Sapphire Nitro+ Radeon RX 7800 XT 16GB', shortName: 'RX 7800 XT 16GB', pricePhp: 30500 },
        'powercolor-7900gre': { id: 'powercolor-7900gre', name: 'PowerColor Hellhound Radeon RX 7900 GRE 16GB', shortName: 'RX 7900 GRE 16GB', pricePhp: 33500 },
        'zotac-rtx-4070s': { id: 'zotac-rtx-4070s', name: 'Zotac GeForce RTX 4070 Super Twin Edge 12GB', shortName: 'RTX 4070 Super 12GB', pricePhp: 31500 },
        'asus-proart-4070s': { id: 'asus-proart-4070s', name: 'ASUS ProArt GeForce RTX 4070 Super OC 12GB', shortName: 'ProArt RTX 4070 Super', pricePhp: 37500 },
        'msi-rtx-4070tis': { id: 'msi-rtx-4070tis', name: 'MSI Ventus 3X GeForce RTX 4070 Ti Super 16GB', shortName: 'RTX 4070 Ti Super 16GB', pricePhp: 43500 },
        'gigabyte-4070tis-oc': { id: 'gigabyte-4070tis-oc', name: 'Gigabyte Gaming OC RTX 4070 Ti Super 16GB', shortName: 'Gigabyte 4070 Ti Super', pricePhp: 46800 },
        'sapphire-rx-7900xtx': { id: 'sapphire-rx-7900xtx', name: 'Sapphire Pulse Radeon RX 7900 XTX 24GB VRAM', shortName: 'RX 7900 XTX 24GB', pricePhp: 56500 },
        'asus-tuf-4080s': { id: 'asus-tuf-4080s', name: 'ASUS TUF Gaming GeForce RTX 4080 Super 16GB', shortName: 'RTX 4080 Super 16GB', pricePhp: 64500 },
        'msi-rtx-4090-slim': { id: 'msi-rtx-4090-slim', name: 'MSI GeForce RTX 4090 Gaming X Slim 24GB VRAM', shortName: 'RTX 4090 24GB', pricePhp: 112000 }
      },
      psu: {
        'msi-a550bn': { id: 'msi-a550bn', name: 'MSI MAG A550BN 550W 80+ Bronze', shortName: 'MSI 550W Bronze', pricePhp: 2650 },
        'corsair-cx650': { id: 'corsair-cx650', name: 'Corsair CX650 650W 80+ Bronze', shortName: 'Corsair 650W', pricePhp: 3100 },
        'cooler-master-750': { id: 'cooler-master-750', name: 'Cooler Master MWE 750W 80+ Bronze V2', shortName: 'Cooler Master 750W', pricePhp: 3500 },
        'fsp-hydro-750': { id: 'fsp-hydro-750', name: 'FSP Hydro K Pro 750W 80+ Bronze ATX 3.0', shortName: 'FSP Hydro 750W', pricePhp: 3900 },
        'msi-a750gl': { id: 'msi-a750gl', name: 'MSI MAG A750GL PCIE5 750W 80+ Gold Modular', shortName: 'MSI A750GL Gold', pricePhp: 4950 },
        'seasonic-focus-750': { id: 'seasonic-focus-750', name: 'Seasonic Focus GX-750 750W 80+ Gold', shortName: 'Seasonic 750W Gold', pricePhp: 5200 },
        'corsair-rm850e': { id: 'corsair-rm850e', name: 'Corsair RM850e 850W 80+ Gold ATX 3.0', shortName: 'Corsair 850W Gold', pricePhp: 5500 },
        'superflower-850': { id: 'superflower-850', name: 'Super Flower Leadex VII XG 850W 80+ Gold ATX 3.0', shortName: 'Leadex VII 850W', pricePhp: 6400 },
        'seasonic-focus-850': { id: 'seasonic-focus-850', name: 'Seasonic Focus GX-850 850W 80+ Gold ATX 3.0', shortName: 'Seasonic 850W Gold', pricePhp: 6900 },
        'bequiet-pp12-1000': { id: 'bequiet-pp12-1000', name: 'be quiet! Pure Power 12 M 1000W 80+ Gold ATX 3.0', shortName: 'be quiet! 1000W Gold', pricePhp: 8500 },
        'corsair-rm1000x': { id: 'corsair-rm1000x', name: 'Corsair RM1000x Shift 1000W 80+ Gold Modular', shortName: 'Corsair 1000W Gold', pricePhp: 9800 },
        'seasonic-vertex-1200': { id: 'seasonic-vertex-1200', name: 'Seasonic Vertex GX-1200 1200W 80+ Gold ATX 3.0', shortName: 'Seasonic 1200W Gold', pricePhp: 12900 }
      },
      pcCase: {
        'tecware-forge-m2': { id: 'tecware-forge-m2', name: 'Tecware Forge M2 Mesh mATX (3 Fans)', shortName: 'Tecware Forge M2', pricePhp: 1850 },
        'tecware-flatline': { id: 'tecware-flatline', name: 'Tecware Flatline mATX Mesh (4 Fans)', shortName: 'Tecware Flatline', pricePhp: 2200 },
        'deepcool-ch370': { id: 'deepcool-ch370', name: 'DeepCool CH370 Tempered Glass mATX Tower', shortName: 'DeepCool CH370', pricePhp: 2950 },
        'montech-air-100': { id: 'montech-air-100', name: 'Montech Air 100 ARGB Mesh mATX (4 Fans)', shortName: 'Montech Air 100', pricePhp: 3200 },
        'asus-ap201': { id: 'asus-ap201', name: 'ASUS Prime AP201 Tempered Glass Mesh', shortName: 'ASUS AP201', pricePhp: 3700 },
        'asus-ap201-white': { id: 'asus-ap201-white', name: 'ASUS Prime AP201 Full-Mesh White mATX', shortName: 'ASUS AP201 White', pricePhp: 3900 },
        'lianli-a3-wood': { id: 'lianli-a3-wood', name: 'Lian Li DAN Cases A3-mATX Walnut Wood Edition', shortName: 'Lian Li A3 Wood', pricePhp: 4300 },
        'phanteks-xt-pro': { id: 'phanteks-xt-pro', name: 'Phanteks XT Pro Ultra Mid-Tower ATX (4x140mm)', shortName: 'Phanteks XT Pro Ultra', pricePhp: 4400 },
        'lianli-216': { id: 'lianli-216', name: 'Lian Li Lancool 216 Airflow Tower', shortName: 'Lian Li 216', pricePhp: 4600 },
        'nzxt-h5-flow': { id: 'nzxt-h5-flow', name: 'NZXT H5 Flow (2024) Compact Mesh ATX', shortName: 'NZXT H5 Flow', pricePhp: 4950 },
        'corsair-4000d': { id: 'corsair-4000d', name: 'Corsair 4000D Airflow Tempered Glass ATX', shortName: 'Corsair 4000D', pricePhp: 5200 },
        'montech-king-95': { id: 'montech-king-95', name: 'Montech King 95 Pro Dual-Chamber ATX (6 Fans)', shortName: 'Montech King 95 Pro', pricePhp: 6900 },
        'fractal-north': { id: 'fractal-north', name: 'Fractal Design North Charcoal Black', shortName: 'Fractal North', pricePhp: 7500 },
        'fractal-north-xl': { id: 'fractal-north-xl', name: 'Fractal Design North XL Full-Tower Walnut Mesh', shortName: 'Fractal North XL', pricePhp: 9800 },
        'asus-proart-pa602': { id: 'asus-proart-pa602', name: 'ASUS ProArt PA602 E-ATX Workstation Chassis', shortName: 'ProArt PA602', pricePhp: 12800 }
      },
      fans: {
        'stock-fans': { id: 'stock-fans', name: 'Included Case Fans + Standard MX-4 Thermal Paste', shortName: 'Included Fans', pricePhp: 0 },
        'thermalright-c12c-3p': { id: 'thermalright-c12c-3p', name: 'Thermalright TL-C12C-S PWM 120mm (3-Pack)', shortName: 'Thermalright 3x120mm', pricePhp: 950 },
        'arctic-p12-3p': { id: 'arctic-p12-3p', name: 'Arctic P12 PWM PST 120mm Quiet Fans (3-Pack)', shortName: 'Arctic P12 3-Pack', pricePhp: 1150 },
        'arctic-p12-5p': { id: 'arctic-p12-5p', name: 'Arctic P12 PWM PST Value 120mm Fans (5-Pack)', shortName: 'Arctic P12 5-Pack', pricePhp: 1650 },
        'ptm7950-arctic-3p': { id: 'ptm7950-arctic-3p', name: 'Honeywell PTM7950 Phase-Change Pad + 3x Arctic P12', shortName: 'PTM7950 + 3x P12', pricePhp: 1750 },
        'arctic-p14-3p': { id: 'arctic-p14-3p', name: 'Arctic P14 Max 140mm High-Airflow Fans (3-Pack)', shortName: 'Arctic P14 Max 3x', pricePhp: 1850 },
        'noctua-a12-2p': { id: 'noctua-a12-2p', name: 'Noctua NF-A12x25 PWM Chromax.black (2-Pack)', shortName: 'Noctua NF-A12 2x', pricePhp: 3600 },
        'phanteks-t30-3p': { id: 'phanteks-t30-3p', name: 'Phanteks T30-120mm Industrial Fans (3-Pack)', shortName: 'Phanteks T30 3x', pricePhp: 4200 }
      },
      wifi: {
        'onboard-net': { id: 'onboard-net', name: 'Use Motherboard Onboard Ethernet / Wi-Fi', shortName: 'Onboard Network', pricePhp: 0 },
        'tplink-tx55e': { id: 'tplink-tx55e', name: 'TP-Link Archer TX55E AX3000 Wi-Fi 6 + BT 5.2 PCIe', shortName: 'TP-Link Wi-Fi 6', pricePhp: 1650 },
        'intel-ax210-pcie': { id: 'intel-ax210-pcie', name: 'Intel AX210 Tri-Band Wi-Fi 6E + BT 5.3 PCIe Card', shortName: 'Intel AX210 6E', pricePhp: 1850 },
        'tplink-txe75e': { id: 'tplink-txe75e', name: 'TP-Link Archer TXE75E AXE5400 Wi-Fi 6E PCIe Card', shortName: 'TP-Link Wi-Fi 6E', pricePhp: 2650 },
        'tplink-tx401-10g': { id: 'tplink-tx401-10g', name: 'TP-Link TX401 10 Gigabit PCIe Studio Network Card', shortName: '10GbE Studio LAN', pricePhp: 4200 },
        'asus-tb4-ex': { id: 'asus-tb4-ex', name: 'ASUS ThunderboltEX 4 Dual-Port PCIe Expansion Card', shortName: 'ThunderboltEX 4', pricePhp: 5400 }
      },
      os: {
        'win11-trial': { id: 'win11-trial', name: 'Windows 11 Clean Setup (Ready for Your Own Key)', shortName: 'Clean Win11 Setup', pricePhp: 0 },
        'ubuntu-dualboot': { id: 'ubuntu-dualboot', name: 'Ubuntu 24.04 LTS / Linux Workstation Setup', shortName: 'Ubuntu 24.04 LTS', pricePhp: 0 },
        'win11-home-oem': { id: 'win11-home-oem', name: 'Microsoft Windows 11 Home 64-Bit OEM License', shortName: 'Win 11 Home OEM', pricePhp: 5800 },
        'win11-pro-oem': { id: 'win11-pro-oem', name: 'Microsoft Windows 11 Pro 64-Bit OEM License', shortName: 'Win 11 Pro OEM', pricePhp: 7500 },
        'win11-pro-retail': { id: 'win11-pro-retail', name: 'Microsoft Windows 11 Pro FPP Retail USB License', shortName: 'Win 11 Pro Retail', pricePhp: 9800 },
        'win11-pro-office': { id: 'win11-pro-office', name: 'Windows 11 Pro + Office Home & Business 2021', shortName: 'Win 11 Pro + Office', pricePhp: 14500 }
      }
    },
    tiers: {
      'campus-cad': {
        id: 'campus-cad',
        name: 'Student & CAD PC',
        segment: 'College Students & Developers',
        pricePhp: 44500,
        partsCogsPhp: 36800,
        assemblyFeePhp: 2500,
        defaultParts: {
          cpu: 'r5-5600',
          cooler: 'deepcool-ak400',
          mobo: 'msi-b550m-vdh',
          ram: 'kingston-32gb-d4',
          ssd: 'wd-sn580-1tb',
          storage2: 'none',
          gpu: 'asus-rtx-4060',
          psu: 'corsair-cx650',
          pcCase: 'tecware-flatline',
          fans: 'stock-fans',
          wifi: 'onboard-net',
          os: 'win11-trial'
        }
      },
      'architect-bim': {
        id: 'architect-bim',
        name: 'Architect & 3D PC',
        segment: 'Designers, Architects & Thesis Work',
        pricePhp: 62500,
        partsCogsPhp: 51800,
        assemblyFeePhp: 2500,
        defaultParts: {
          cpu: 'r7-7700',
          cooler: 'thermalright-pa120',
          mobo: 'msi-b650m-p',
          ram: 'gskill-64gb-d5',
          ssd: 'lexar-nm790-2tb',
          storage2: 'none',
          gpu: 'zotac-rtx-4060ti',
          psu: 'cooler-master-750',
          pcCase: 'asus-ap201',
          fans: 'stock-fans',
          wifi: 'onboard-net',
          os: 'win11-trial'
        }
      },
      'studio-render': {
        id: 'studio-render',
        name: 'Studio & AI PC',
        segment: 'Video Studios & Heavy 3D Render',
        pricePhp: 96000,
        partsCogsPhp: 80500,
        assemblyFeePhp: 2500,
        defaultParts: {
          cpu: 'r9-7900x',
          cooler: 'arctic-lf3-240',
          mobo: 'asus-tuf-b650',
          ram: 'corsair-64gb-d5',
          ssd: 'samsung-990pro-2tb',
          storage2: 'none',
          gpu: 'zotac-rtx-4070s',
          psu: 'corsair-rm850e',
          pcCase: 'lianli-216',
          fans: 'stock-fans',
          wifi: 'onboard-net',
          os: 'win11-trial'
        }
      }
    },
    addons: {
      'ups-1000': {
        id: 'ups-1000',
        name: 'APC Back-UPS BVX1200LI-MS 1200VA Backup UPS',
        pricePhp: 4600,
        cogsPhp: 3700
      },
      'ups-1500': {
        id: 'ups-1500',
        name: 'CyberPower VP1600ELCD 1600VA Backup UPS',
        pricePhp: 5800,
        cogsPhp: 4600
      },
      'ups-sine-1500': {
        id: 'ups-sine-1500',
        name: 'CyberPower CP1500EPFCLCD Pure Sine Wave UPS',
        pricePhp: 12900,
        cogsPhp: 10600
      },
      'mon-aoc-24': {
        id: 'mon-aoc-24',
        name: 'AOC 24G4 24" 1080p 180Hz Fast IPS Monitor',
        pricePhp: 7900,
        cogsPhp: 6500
      },
      'ram-kit': {
        id: 'ram-kit',
        name: 'ASUS ProArt PA278QV 27" QHD IPS Monitor',
        pricePhp: 14500,
        cogsPhp: 12200
      },
      'mon-lg-27-qhd': {
        id: 'mon-lg-27-qhd',
        name: 'LG UltraGear 27GS75Q 27" 1440p 180Hz IPS Monitor',
        pricePhp: 15800,
        cogsPhp: 13200
      },
      'mon-proart-4k': {
        id: 'mon-proart-4k',
        name: 'ASUS ProArt PA279CRV 27" 4K UHD USB-C Monitor',
        pricePhp: 28500,
        cogsPhp: 24200
      },
      'mon-dell-34-uw': {
        id: 'mon-dell-34-uw',
        name: 'Dell UltraSharp U3425WE 34" WQHD Curved IPS',
        pricePhp: 46500,
        cogsPhp: 39800
      },
      'color-cal': {
        id: 'color-cal',
        name: 'Logitech G304 Wireless Mouse + Keychron C3 Pro Keyboard',
        pricePhp: 3600,
        cogsPhp: 2800
      },
      'periph-mx-combo': {
        id: 'periph-mx-combo',
        name: 'Logitech MX Master 3S + Keychron K8 Pro Wireless',
        pricePhp: 9800,
        cogsPhp: 8100
      },
      'wacom-intuos-m': {
        id: 'wacom-intuos-m',
        name: 'Wacom Intuos Medium Bluetooth Pen Tablet',
        pricePhp: 11200,
        cogsPhp: 9400
      },
      'webcam-headset': {
        id: 'webcam-headset',
        name: 'Logitech Brio 500 1080p Webcam + Jabra Evolve2 20',
        pricePhp: 6900,
        cogsPhp: 5700
      }
    },
    slas: {
      'none': {
        id: 'none',
        name: 'Build Only (Free 1-Year Shop Warranty)',
        seats: 0,
        monthlyPhp: 0,
        directCostPhp: 0,
        terms: 'No monthly fee (B2C friendly). Includes a 1-year free assembly warranty and workshop drop-off diagnostics in Quezon City.'
      },
      'b2c-care': {
        id: 'b2c-care',
        name: 'Personal Home Plus (Cleaning + Chat Help)',
        seats: 1,
        monthlyPhp: 500,
        directCostPhp: 150,
        terms: 'Optional add-on for personal buyers: 2x/year dust cleaning & fresh thermal paste plus priority chat/remote troubleshooting.'
      },
      'studio-8': {
        id: 'studio-8',
        name: 'Small Studio Plan (Up to 8 PCs)',
        seats: 8,
        monthlyPhp: 12000,
        directCostPhp: 3000,
        terms: 'B2B office plan: 15-min phone/chat help, 4-hr on-site tech visit in Quezon City, monthly PC checkups (parts billed at cost).'
      },
      'sme-15': {
        id: 'sme-15',
        name: 'Office Standard Plan (Up to 15 PCs)',
        seats: 15,
        monthlyPhp: 19500,
        directCostPhp: 4800,
        terms: 'B2B office plan: Checkups every 2 weeks, 4-hr on-site support, plus 1 free loaner PC if a computer goes in for repair.'
      },
      'clinic-25': {
        id: 'clinic-25',
        name: 'Clinic & Multi-Team Plan (Up to 25 PCs)',
        seats: 25,
        monthlyPhp: 29000,
        directCostPhp: 7200,
        terms: 'B2B office plan: Weekly on-site visits, backup checks, 2 free loaner PCs, and priority 2-hr on-site support.'
      }
    },
    paymentPlans: {
      'split-70-30': {
        id: 'split-70-30',
        name: '70/30 Split (0% Fee)',
        shortName: '70/30 Split',
        upFrontRatio: 0.70,
        months: 0,
        feeRate: 0
      },
      'inst-3': {
        id: 'inst-3',
        name: '3 Mos — 0% (30% Down)',
        shortName: '3 Mos (0%)',
        upFrontRatio: 0.30,
        months: 3,
        feeRate: 0
      },
      'inst-6': {
        id: 'inst-6',
        name: '6 Mos — 5% (30% Down)',
        shortName: '6 Mos (+5%)',
        upFrontRatio: 0.30,
        months: 6,
        feeRate: 0.05
      },
      'inst-12': {
        id: 'inst-12',
        name: '12 Mos — 10% (30% Down)',
        shortName: '12 Mos (+10%)',
        upFrontRatio: 0.30,
        months: 12,
        feeRate: 0.10
      },
      'b2b-po': {
        id: 'b2b-po',
        name: 'Company PO (50/50)',
        shortName: 'Company PO (50/50)',
        upFrontRatio: 0.50,
        months: 0,
        feeRate: 0
      }
    },
    depositRatio: 0.7,
    capexTotalPhp: 345000,
    fixedOpexBasePhp: 94500,
    secondTechStepPhp: 28000,
    singleTechMaxBuilds: 14,
    singleTechMaxSeats: 35,
    vatCliffAnnualPhp: 3000000
  };

  var DEFAULT_QUOTE = {
    buyerType: 'b2c',
    paymentPlan: 'split-70-30',
    tierId: 'architect-bim',
    qty: 1,
    parts: Object.assign({}, PROPOSAL_CATALOG.tiers['architect-bim'].defaultParts),
    addons: [],
    slaId: 'none',
    detachedFromContact: false
  };

  var phpFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  });

  function formatPhp(amount) {
    var safeNum = Number.isFinite(amount) ? Math.round(amount) : 0;
    return phpFormatter.format(safeNum);
  }

  function clampInt(val, min, max, fallback) {
    var parsed = parseInt(val, 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  function clampFloat(val, min, max, fallback) {
    var parsed = parseFloat(val);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  var PART_COMPAT_SPECS = {
    cpu: {
      'r5-5500': { socket: 'AM4', tdpW: 65 },
      'r5-5600': { socket: 'AM4', tdpW: 65 },
      'r5-5600x': { socket: 'AM4', tdpW: 65 },
      'r7-5700x': { socket: 'AM4', tdpW: 65 },
      'r7-5700x3d': { socket: 'AM4', tdpW: 105 },
      'r5-7500f': { socket: 'AM5', tdpW: 65 },
      'r5-7600': { socket: 'AM5', tdpW: 65 },
      'r5-9600x': { socket: 'AM5', tdpW: 65 },
      'r7-7700': { socket: 'AM5', tdpW: 65 },
      'r7-9700x': { socket: 'AM5', tdpW: 65 },
      'r7-7800x3d': { socket: 'AM5', tdpW: 120 },
      'r7-9800x3d': { socket: 'AM5', tdpW: 120 },
      'r9-7900x': { socket: 'AM5', tdpW: 170 },
      'r9-9900x': { socket: 'AM5', tdpW: 120 },
      'r9-7950x': { socket: 'AM5', tdpW: 170 },
      'r9-9950x': { socket: 'AM5', tdpW: 170 },
      'i3-14100f': { socket: 'LGA1700', tdpW: 65 },
      'i5-12400f': { socket: 'LGA1700', tdpW: 65 },
      'i5-13400f': { socket: 'LGA1700', tdpW: 65 },
      'i5-14400f': { socket: 'LGA1700', tdpW: 65 },
      'i5-14600k': { socket: 'LGA1700', tdpW: 181 },
      'i7-14700k': { socket: 'LGA1700', tdpW: 253 },
      'i9-14900k': { socket: 'LGA1700', tdpW: 253 },
      'ultra7-265k': { socket: 'LGA1851', tdpW: 250 }
    },
    mobo: {
      'asrock-b550m-pro4': { socket: 'AM4', ramType: 'DDR4', formFactor: 'mATX' },
      'msi-b550m-vdh': { socket: 'AM4', ramType: 'DDR4', formFactor: 'mATX' },
      'asus-tuf-b550m': { socket: 'AM4', ramType: 'DDR4', formFactor: 'mATX' },
      'msi-b760m-bomber': { socket: 'LGA1700', ramType: 'DDR4', formFactor: 'mATX' },
      'gigabyte-b760m-ds3h': { socket: 'LGA1700', ramType: 'DDR5', formFactor: 'mATX' },
      'msi-b760-tomahawk': { socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX' },
      'asus-z790p-wifi': { socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX' },
      'msi-z790-tomahawk': { socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX' },
      'msi-z890-pro': { socket: 'LGA1851', ramType: 'DDR5', formFactor: 'ATX' },
      'msi-b650m-p': { socket: 'AM5', ramType: 'DDR5', formFactor: 'mATX' },
      'asrock-b650m-hdv': { socket: 'AM5', ramType: 'DDR5', formFactor: 'mATX' },
      'gigabyte-b650m-aorus': { socket: 'AM5', ramType: 'DDR5', formFactor: 'mATX' },
      'asrock-b650m-riptide': { socket: 'AM5', ramType: 'DDR5', formFactor: 'mATX' },
      'asus-tuf-b650': { socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX' },
      'msi-b650-tomahawk': { socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX' },
      'gigabyte-x670e-pro': { socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX' },
      'asus-proart-x870e': { socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX' }
    },
    ram: {
      'kingston-16gb-d4': { ramType: 'DDR4' },
      'team-16gb-d4': { ramType: 'DDR4' },
      'kingston-32gb-d4': { ramType: 'DDR4' },
      'corsair-32gb-d4': { ramType: 'DDR4' },
      'gskill-64gb-d4': { ramType: 'DDR4' },
      'crucial-16gb-d5': { ramType: 'DDR5' },
      'kingston-32gb-d5': { ramType: 'DDR5' },
      'team-create-32gb-d5': { ramType: 'DDR5' },
      'lexar-ares-32gb-d5': { ramType: 'DDR5' },
      'gskill-64gb-d5': { ramType: 'DDR5' },
      'corsair-64gb-d5': { ramType: 'DDR5' },
      'gskill-neo-64gb-d5': { ramType: 'DDR5' },
      'corsair-96gb-d5': { ramType: 'DDR5' },
      'kingston-128gb-d5': { ramType: 'DDR5' }
    },
    cooler: {
      'id-se214-xt': { tdpMaxW: 150, radMm: 0 },
      'deepcool-ak400': { tdpMaxW: 200, radMm: 0 },
      'arctic-f36': { tdpMaxW: 210, radMm: 0 },
      'thermalright-pa120': { tdpMaxW: 260, radMm: 0 },
      'thermalright-ps120': { tdpMaxW: 270, radMm: 0 },
      'scythe-fuma3': { tdpMaxW: 250, radMm: 0 },
      'deepcool-ak620': { tdpMaxW: 260, radMm: 0 },
      'bequiet-drp5': { tdpMaxW: 270, radMm: 0 },
      'noctua-nhd15-g2': { tdpMaxW: 280, radMm: 0 },
      'deepcool-le520': { tdpMaxW: 250, radMm: 240 },
      'arctic-lf3-240': { tdpMaxW: 280, radMm: 240 },
      'arctic-lf3-360': { tdpMaxW: 320, radMm: 360 },
      'lianli-galahad-360': { tdpMaxW: 320, radMm: 360 },
      'nzxt-kraken-360': { tdpMaxW: 320, radMm: 360 }
    },
    gpu: {
      'sapphire-rx-6600': { tdpW: 132, minPsuW: 550, longGpu: false },
      'asrock-rx-7600': { tdpW: 165, minPsuW: 550, longGpu: false },
      'galax-rtx-3060-12g': { tdpW: 170, minPsuW: 550, longGpu: false },
      'intel-arc-b580': { tdpW: 190, minPsuW: 650, longGpu: false },
      'asus-rtx-4060': { tdpW: 115, minPsuW: 550, longGpu: false },
      'msi-rtx-4060-ventus': { tdpW: 115, minPsuW: 550, longGpu: false },
      'gigabyte-rtx-4060-aero': { tdpW: 115, minPsuW: 550, longGpu: false },
      'zotac-rtx-4060ti': { tdpW: 165, minPsuW: 550, longGpu: false },
      'sapphire-rx-7700xt': { tdpW: 245, minPsuW: 750, longGpu: false },
      'msi-rtx-4060ti-16g': { tdpW: 165, minPsuW: 550, longGpu: false },
      'sapphire-rx-7800xt': { tdpW: 263, minPsuW: 750, longGpu: true },
      'powercolor-7900gre': { tdpW: 260, minPsuW: 750, longGpu: true },
      'zotac-rtx-4070s': { tdpW: 220, minPsuW: 650, longGpu: false },
      'asus-proart-4070s': { tdpW: 220, minPsuW: 650, longGpu: false },
      'msi-rtx-4070tis': { tdpW: 285, minPsuW: 750, longGpu: true },
      'gigabyte-4070tis-oc': { tdpW: 285, minPsuW: 750, longGpu: true },
      'sapphire-rx-7900xtx': { tdpW: 355, minPsuW: 850, longGpu: true },
      'asus-tuf-4080s': { tdpW: 320, minPsuW: 850, longGpu: true },
      'msi-rtx-4090-slim': { tdpW: 450, minPsuW: 1000, longGpu: true }
    },
    psu: {
      'msi-a550bn': { watts: 550 },
      'corsair-cx650': { watts: 650 },
      'cooler-master-750': { watts: 750 },
      'fsp-hydro-750': { watts: 750 },
      'msi-a750gl': { watts: 750 },
      'seasonic-focus-750': { watts: 750 },
      'corsair-rm850e': { watts: 850 },
      'superflower-850': { watts: 850 },
      'seasonic-focus-850': { watts: 850 },
      'bequiet-pp12-1000': { watts: 1000 },
      'corsair-rm1000x': { watts: 1000 },
      'seasonic-vertex-1200': { watts: 1200 }
    },
    pcCase: {
      'tecware-forge-m2': { formFactors: ['mATX'], maxRad: 240, fitsLongGpu: false },
      'tecware-flatline': { formFactors: ['mATX'], maxRad: 240, fitsLongGpu: false },
      'deepcool-ch370': { formFactors: ['mATX'], maxRad: 240, fitsLongGpu: false },
      'montech-air-100': { formFactors: ['mATX'], maxRad: 240, fitsLongGpu: false },
      'asus-ap201': { formFactors: ['mATX'], maxRad: 360, fitsLongGpu: true },
      'asus-ap201-white': { formFactors: ['mATX'], maxRad: 360, fitsLongGpu: true },
      'lianli-a3-wood': { formFactors: ['mATX'], maxRad: 360, fitsLongGpu: true },
      'phanteks-xt-pro': { formFactors: ['mATX', 'ATX'], maxRad: 360, fitsLongGpu: true },
      'lianli-216': { formFactors: ['mATX', 'ATX'], maxRad: 360, fitsLongGpu: true },
      'nzxt-h5-flow': { formFactors: ['mATX', 'ATX'], maxRad: 360, fitsLongGpu: true },
      'corsair-4000d': { formFactors: ['mATX', 'ATX'], maxRad: 360, fitsLongGpu: true },
      'montech-king-95': { formFactors: ['mATX', 'ATX'], maxRad: 360, fitsLongGpu: true },
      'fractal-north': { formFactors: ['mATX', 'ATX'], maxRad: 360, fitsLongGpu: true },
      'fractal-north-xl': { formFactors: ['mATX', 'ATX'], maxRad: 360, fitsLongGpu: true },
      'asus-proart-pa602': { formFactors: ['mATX', 'ATX'], maxRad: 360, fitsLongGpu: true }
    }
  };

  function getMinPsuWattsForParts(parts) {
    var cpuSpec = PART_COMPAT_SPECS.cpu[parts.cpu] || { tdpW: 65 };
    var gpuSpec = PART_COMPAT_SPECS.gpu[parts.gpu] || { tdpW: 165, minPsuW: 550 };
    var rawEstLoad = cpuSpec.tdpW + gpuSpec.tdpW + 150;
    return Math.max(gpuSpec.minPsuW, rawEstLoad <= 500 ? 550 : (rawEstLoad <= 600 ? 650 : (rawEstLoad <= 720 ? 750 : (rawEstLoad <= 830 ? 850 : 1000))));
  }

  function isPartOptionCompatible(catId, optionId, parts) {
    var cpuSpec = PART_COMPAT_SPECS.cpu[parts.cpu] || { socket: 'AM5', tdpW: 65 };
    var moboSpec = PART_COMPAT_SPECS.mobo[parts.mobo] || { socket: cpuSpec.socket, ramType: 'DDR5', formFactor: 'mATX' };
    var coolerSpec = PART_COMPAT_SPECS.cooler[parts.cooler] || { tdpMaxW: 250, radMm: 0 };
    var gpuSpec = PART_COMPAT_SPECS.gpu[parts.gpu] || { tdpW: 165, minPsuW: 550, longGpu: false };

    if (catId === 'mobo') {
      var m = PART_COMPAT_SPECS.mobo[optionId];
      return Boolean(m && m.socket === cpuSpec.socket);
    }
    if (catId === 'ram') {
      var r = PART_COMPAT_SPECS.ram[optionId];
      return Boolean(r && r.ramType === moboSpec.ramType);
    }
    if (catId === 'cooler') {
      var c = PART_COMPAT_SPECS.cooler[optionId];
      return Boolean(c && c.tdpMaxW >= cpuSpec.tdpW);
    }
    if (catId === 'psu') {
      var p = PART_COMPAT_SPECS.psu[optionId];
      return Boolean(p && p.watts >= getMinPsuWattsForParts(parts));
    }
    if (catId === 'pcCase') {
      var cs = PART_COMPAT_SPECS.pcCase[optionId];
      if (!cs) { return true; }
      if (cs.formFactors.indexOf(moboSpec.formFactor) === -1) { return false; }
      if (coolerSpec.radMm > cs.maxRad) { return false; }
      if (gpuSpec.longGpu && !cs.fitsLongGpu) { return false; }
      return true;
    }
    if (catId === 'fans') {
      if (optionId === 'arctic-p14-3p') {
        var curCaseSpec = PART_COMPAT_SPECS.pcCase[parts.pcCase];
        return Boolean(curCaseSpec && curCaseSpec.formFactors.indexOf('ATX') !== -1);
      }
      return true;
    }
    if (catId === 'wifi') {
      if (optionId === 'tplink-tx401-10g') {
        return moboSpec.formFactor === 'ATX';
      }
      if (optionId === 'asus-tb4-ex') {
        return parts.mobo === 'asus-z790p-wifi' || parts.mobo === 'asus-tuf-b650' || parts.mobo === 'asus-proart-x870e';
      }
      return true;
    }
    return true;
  }

  function getPartIncompatReason(catId, optionId, parts) {
    if (isPartOptionCompatible(catId, optionId, parts)) {
      return null;
    }
    var cpuSpec = PART_COMPAT_SPECS.cpu[parts.cpu] || { socket: 'AM5', tdpW: 65 };
    var moboSpec = PART_COMPAT_SPECS.mobo[parts.mobo] || { socket: cpuSpec.socket, ramType: 'DDR5', formFactor: 'mATX' };
    var coolerSpec = PART_COMPAT_SPECS.cooler[parts.cooler] || { tdpMaxW: 250, radMm: 0 };
    var gpuSpec = PART_COMPAT_SPECS.gpu[parts.gpu] || { tdpW: 165, minPsuW: 550, longGpu: false };

    if (catId === 'mobo') {
      var m = PART_COMPAT_SPECS.mobo[optionId];
      return m ? ('Switches CPU to ' + m.socket + ' (' + m.ramType + ')') : 'Incompatible board';
    }
    if (catId === 'ram') {
      var r = PART_COMPAT_SPECS.ram[optionId];
      return r ? ('Switches build to ' + r.ramType) : 'Incompatible RAM';
    }
    if (catId === 'cooler') {
      var c = PART_COMPAT_SPECS.cooler[optionId];
      return c ? ('Rated ' + c.tdpMaxW + 'W < ' + cpuSpec.tdpW + 'W CPU') : 'Under-cooled';
    }
    if (catId === 'psu') {
      var minW = getMinPsuWattsForParts(parts);
      return 'Below ' + minW + 'W GPU/build minimum';
    }
    if (catId === 'pcCase') {
      var cs = PART_COMPAT_SPECS.pcCase[optionId];
      if (!cs) { return null; }
      if (cs.formFactors.indexOf(moboSpec.formFactor) === -1) { return 'No ' + moboSpec.formFactor + ' board support'; }
      if (coolerSpec.radMm > cs.maxRad) { return 'No ' + coolerSpec.radMm + 'mm radiator room'; }
      if (gpuSpec.longGpu && !cs.fitsLongGpu) { return 'Too short for selected GPU'; }
    }
    if (catId === 'fans') {
      return 'Requires ATX case (3x 140mm)';
    }
    if (catId === 'wifi') {
      return optionId === 'asus-tb4-ex'
        ? 'Requires ASUS ATX board'
        : 'Requires ATX PCIe x4 slot';
    }
    return 'Incompatible';
  }

  function pickFirstCompatibleId(catId, parts, preferredPred) {
    var keys = Object.keys(PROPOSAL_CATALOG.parts[catId]);
    var i;
    if (preferredPred) {
      for (i = 0; i < keys.length; i += 1) {
        if (isPartOptionCompatible(catId, keys[i], parts) && preferredPred(keys[i])) {
          return keys[i];
        }
      }
    }
    for (i = 0; i < keys.length; i += 1) {
      if (isPartOptionCompatible(catId, keys[i], parts)) {
        return keys[i];
      }
    }
    return keys[0];
  }

  function reconcilePartsCompatibility(rawParts, changedCat) {
    var next = Object.assign({}, rawParts);
    var changed = [];

    function fixIfNeeded(catId, label, preferredPred) {
      if (!isPartOptionCompatible(catId, next[catId], next)) {
        var picked = pickFirstCompatibleId(catId, next, preferredPred);
        if (picked && picked !== next[catId]) {
          next[catId] = picked;
          changed.push(label);
        }
      }
    }

    if (changedCat === 'mobo') {
      var pickedMobo = PART_COMPAT_SPECS.mobo[next.mobo];
      var curCpu = PART_COMPAT_SPECS.cpu[next.cpu];
      if (pickedMobo && curCpu && pickedMobo.socket !== curCpu.socket) {
        var cpuKeys = Object.keys(PROPOSAL_CATALOG.parts.cpu);
        for (var i = 0; i < cpuKeys.length; i += 1) {
          var cs = PART_COMPAT_SPECS.cpu[cpuKeys[i]];
          if (cs && cs.socket === pickedMobo.socket) {
            next.cpu = cpuKeys[i];
            changed.push('CPU');
            break;
          }
        }
      }
    } else if (changedCat === 'ram') {
      var pickedRam = PART_COMPAT_SPECS.ram[next.ram];
      var curMoboForRam = PART_COMPAT_SPECS.mobo[next.mobo];
      if (pickedRam && curMoboForRam && pickedRam.ramType !== curMoboForRam.ramType) {
        var moboKeys = Object.keys(PROPOSAL_CATALOG.parts.mobo);
        var curCpuForRam = PART_COMPAT_SPECS.cpu[next.cpu];
        var matchedMoboId = null;
        for (var mIdx = 0; mIdx < moboKeys.length; mIdx += 1) {
          var msCand = PART_COMPAT_SPECS.mobo[moboKeys[mIdx]];
          if (msCand && msCand.ramType === pickedRam.ramType && curCpuForRam && msCand.socket === curCpuForRam.socket) {
            matchedMoboId = moboKeys[mIdx];
            break;
          }
        }
        if (!matchedMoboId) {
          for (var mIdx2 = 0; mIdx2 < moboKeys.length; mIdx2 += 1) {
            var msAny = PART_COMPAT_SPECS.mobo[moboKeys[mIdx2]];
            if (msAny && msAny.ramType === pickedRam.ramType) {
              matchedMoboId = moboKeys[mIdx2];
              break;
            }
          }
        }
        if (matchedMoboId) {
          next.mobo = matchedMoboId;
          changed.push('Motherboard');
          var newMoboSpec = PART_COMPAT_SPECS.mobo[matchedMoboId];
          if (newMoboSpec && (!curCpuForRam || curCpuForRam.socket !== newMoboSpec.socket)) {
            var allCpus = Object.keys(PROPOSAL_CATALOG.parts.cpu);
            for (var cIdx = 0; cIdx < allCpus.length; cIdx += 1) {
              var cpuCand = PART_COMPAT_SPECS.cpu[allCpus[cIdx]];
              if (cpuCand && cpuCand.socket === newMoboSpec.socket) {
                next.cpu = allCpus[cIdx];
                changed.push('CPU');
                break;
              }
            }
          }
        }
      }
    } else if (changedCat === 'pcCase') {
      var pickedCase = PART_COMPAT_SPECS.pcCase[next.pcCase];
      var curMoboForCase = PART_COMPAT_SPECS.mobo[next.mobo];
      if (pickedCase && curMoboForCase && pickedCase.formFactors.indexOf(curMoboForCase.formFactor) === -1) {
        var moboList = Object.keys(PROPOSAL_CATALOG.parts.mobo);
        var curCpuForCase = PART_COMPAT_SPECS.cpu[next.cpu];
        var fitMoboId = null;
        for (var fIdx = 0; fIdx < moboList.length; fIdx += 1) {
          var mSpec = PART_COMPAT_SPECS.mobo[moboList[fIdx]];
          if (mSpec && pickedCase.formFactors.indexOf(mSpec.formFactor) !== -1 && curCpuForCase && mSpec.socket === curCpuForCase.socket) {
            fitMoboId = moboList[fIdx];
            break;
          }
        }
        if (fitMoboId) {
          next.mobo = fitMoboId;
          changed.push('Motherboard');
        }
      }
    }

    var prevRam = PART_COMPAT_SPECS.ram[next.ram];
    fixIfNeeded('mobo', 'Motherboard', function (mId) {
      var ms = PART_COMPAT_SPECS.mobo[mId];
      return prevRam && ms && ms.ramType === prevRam.ramType;
    });
    fixIfNeeded('ram', 'Memory', null);
    fixIfNeeded('cooler', 'Cooler', null);
    fixIfNeeded('psu', 'Power Supply', null);
    fixIfNeeded('pcCase', 'Case', null);
    fixIfNeeded('fans', 'Fans', null);
    fixIfNeeded('wifi', 'Network Card', null);

    var finalCpu = PART_COMPAT_SPECS.cpu[next.cpu] || { socket: 'AM5', tdpW: 65 };
    var finalMobo = PART_COMPAT_SPECS.mobo[next.mobo] || { socket: 'AM5', ramType: 'DDR5', formFactor: 'mATX' };
    var finalGpu = PART_COMPAT_SPECS.gpu[next.gpu] || { tdpW: 165 };
    var finalPsu = PART_COMPAT_SPECS.psu[next.psu] || { watts: 750 };
    var estLoadW = finalCpu.tdpW + finalGpu.tdpW + 150;

    return {
      parts: next,
      adjustedLabels: changed,
      summaryText: 'Compatible · ' + finalMobo.socket + ' · ' + finalMobo.ramType + ' · ~' + String(estLoadW) + 'W load / ' + String(finalPsu.watts) + 'W PSU · ' + finalMobo.formFactor + ' fit'
    };
  }

  function normalizePartsForTier(tierId, rawParts) {
    var tier = PROPOSAL_CATALOG.tiers[tierId] || PROPOSAL_CATALOG.tiers[DEFAULT_QUOTE.tierId];
    var source = rawParts && typeof rawParts === 'object' ? rawParts : {};
    var normalized = {};
    PART_CATEGORIES.forEach(function (cat) {
      var catCatalog = PROPOSAL_CATALOG.parts[cat.id];
      var candidateId = source[cat.id];
      normalized[cat.id] = (candidateId && catCatalog[candidateId])
        ? candidateId
        : tier.defaultParts[cat.id];
    });
    return reconcilePartsCompatibility(normalized, null).parts;
  }

  function computeCustomerPaymentPlan(hardwareTotalPhp, planId) {
    var plan = PROPOSAL_CATALOG.paymentPlans[planId] || PROPOSAL_CATALOG.paymentPlans[DEFAULT_QUOTE.paymentPlan];
    var baseTotal = Number.isFinite(hardwareTotalPhp) ? Math.max(0, Math.round(hardwareTotalPhp)) : 0;
    var downPaymentPhp = Math.round(baseTotal * plan.upFrontRatio);
    var remainderBase = baseTotal - downPaymentPhp;
    var installmentFeePhp = plan.months > 0 ? Math.round(remainderBase * plan.feeRate) : 0;
    var totalPayablePhp = baseTotal + installmentFeePhp;
    var financedBalancePhp = totalPayablePhp - downPaymentPhp;
    var monthlyInstallmentPhp = plan.months > 0 ? Math.round(financedBalancePhp / plan.months) : 0;
    var pickupBalancePhp = plan.months > 0 ? 0 : financedBalancePhp;

    return {
      plan: plan,
      baseTotalPhp: baseTotal,
      downPaymentPhp: downPaymentPhp,
      pickupBalancePhp: pickupBalancePhp,
      installmentFeePhp: installmentFeePhp,
      totalPayablePhp: totalPayablePhp,
      financedBalancePhp: financedBalancePhp,
      monthlyInstallmentPhp: monthlyInstallmentPhp,
      months: plan.months
    };
  }

  function computeQuoteMetrics(quoteInput) {
    var q = quoteInput || DEFAULT_QUOTE;
    var buyerType = q.buyerType === 'b2b' ? 'b2b' : 'b2c';
    var tier = PROPOSAL_CATALOG.tiers[q.tierId] || PROPOSAL_CATALOG.tiers[DEFAULT_QUOTE.tierId];
    var sla = PROPOSAL_CATALOG.slas[q.slaId] || PROPOSAL_CATALOG.slas[DEFAULT_QUOTE.slaId];
    var qty = clampInt(q.qty, 1, 10, 1);
    var normalizedParts = normalizePartsForTier(tier.id, q.parts);
    var validAddons = Array.isArray(q.addons)
      ? q.addons.filter(function (id) { return Boolean(PROPOSAL_CATALOG.addons[id]); })
      : [];

    var partsSubtotalPhp = 0;
    var partsBreakdown = [];
    var isPartsCustomized = false;

    PART_CATEGORIES.forEach(function (cat) {
      var partId = normalizedParts[cat.id];
      var partItem = PROPOSAL_CATALOG.parts[cat.id][partId];
      if (partId !== tier.defaultParts[cat.id]) {
        isPartsCustomized = true;
      }
      partsSubtotalPhp += partItem.pricePhp;
      partsBreakdown.push({
        categoryId: cat.id,
        label: cat.label,
        partId: partItem.id,
        name: partItem.name,
        shortName: partItem.shortName,
        pricePhp: partItem.pricePhp,
        isDefaultOptional: Boolean(cat.defaultId && partItem.id === cat.defaultId)
      });
    });

    var assemblyFeePhp = PROPOSAL_CATALOG.assemblyFeePhp;
    var unitBasePhp = partsSubtotalPhp + assemblyFeePhp;
    var partsCogsPhp = Math.round(partsSubtotalPhp * 0.85);

    var addonUnitPrice = 0;
    var addonUnitCogs = 0;
    validAddons.forEach(function (id) {
      addonUnitPrice += PROPOSAL_CATALOG.addons[id].pricePhp;
      addonUnitCogs += PROPOSAL_CATALOG.addons[id].cogsPhp;
    });

    var unitBuildTotalPhp = unitBasePhp + addonUnitPrice;
    var unitCogsPhp = partsCogsPhp + addonUnitCogs;
    var hardwareTotalPhp = unitBuildTotalPhp * qty;
    var hardwareCogsTotalPhp = unitCogsPhp * qty;
    var depositPhp = Math.round(hardwareTotalPhp * PROPOSAL_CATALOG.depositRatio);
    var balanceOnReleasePhp = hardwareTotalPhp - depositPhp;
    var monthlySlaPhp = sla.monthlyPhp;
    var monthlySlaDirectCostPhp = sla.directCostPhp;
    var payment = computeCustomerPaymentPlan(hardwareTotalPhp, q.paymentPlan);

    var cpuObj = PROPOSAL_CATALOG.parts.cpu[normalizedParts.cpu];
    var ramObj = PROPOSAL_CATALOG.parts.ram[normalizedParts.ram];
    var ssdObj = PROPOSAL_CATALOG.parts.ssd[normalizedParts.ssd];
    var gpuObj = PROPOSAL_CATALOG.parts.gpu[normalizedParts.gpu];
    var specsSummary = [cpuObj.shortName, ramObj.shortName, ssdObj.shortName, gpuObj.shortName].join(' · ');
    var displayTitle = tier.name + (isPartsCustomized ? ' (Custom Parts)' : '');

    return {
      buyerType: buyerType,
      payment: payment,
      tier: tier,
      sla: sla,
      qty: qty,
      parts: normalizedParts,
      partsBreakdown: partsBreakdown,
      isPartsCustomized: isPartsCustomized,
      partsSubtotalPhp: partsSubtotalPhp,
      assemblyFeePhp: assemblyFeePhp,
      specsSummary: specsSummary,
      displayTitle: displayTitle,
      addons: validAddons,
      unitBuildTotalPhp: unitBuildTotalPhp,
      hardwareTotalPhp: hardwareTotalPhp,
      hardwareCogsTotalPhp: hardwareCogsTotalPhp,
      buildGrossMarginPhp: hardwareTotalPhp - hardwareCogsTotalPhp,
      depositPhp: depositPhp,
      balanceOnReleasePhp: balanceOnReleasePhp,
      monthlySlaPhp: monthlySlaPhp,
      monthlySlaMarginPhp: monthlySlaPhp - monthlySlaDirectCostPhp
    };
  }

  function sanitizeState(raw) {
    var safe = raw && typeof raw === 'object' ? raw : {};
    var quote = safe.activeQuote && typeof safe.activeQuote === 'object' ? safe.activeQuote : {};
    var buyerType = quote.buyerType === 'b2b' ? 'b2b' : 'b2c';
    var paymentPlan = PROPOSAL_CATALOG.paymentPlans[quote.paymentPlan] ? quote.paymentPlan : DEFAULT_QUOTE.paymentPlan;
    var tierId = PROPOSAL_CATALOG.tiers[quote.tierId] ? quote.tierId : DEFAULT_QUOTE.tierId;
    var slaId = PROPOSAL_CATALOG.slas[quote.slaId] ? quote.slaId : DEFAULT_QUOTE.slaId;
    var qty = clampInt(quote.qty, 1, 10, 1);
    var parts = normalizePartsForTier(tierId, quote.parts);
    var addons = Array.isArray(quote.addons)
      ? quote.addons.filter(function (id) { return Boolean(PROPOSAL_CATALOG.addons[id]); })
      : [];
    var detached = Boolean(quote.detachedFromContact);
    var isCustom = Boolean(safe.isCustom);

    var normalizedQuote = {
      buyerType: buyerType,
      paymentPlan: paymentPlan,
      tierId: tierId,
      qty: qty,
      parts: parts,
      addons: addons,
      slaId: slaId,
      detachedFromContact: detached
    };

    return {
      schemaVersion: SCHEMA_VERSION,
      updatedAt: typeof safe.updatedAt === 'string' ? safe.updatedAt : new Date().toISOString(),
      isCustom: isCustom,
      activeQuote: normalizedQuote,
      totals: computeQuoteMetrics(normalizedQuote)
    };
  }

  function parsePartsParam(partsStr) {
    if (!partsStr || typeof partsStr !== 'string') {
      return {};
    }
    var result = {};
    partsStr.split(',').forEach(function (pair) {
      var pieces = pair.split(':');
      if (pieces.length === 2 && pieces[0] && pieces[1]) {
        result[pieces[0].trim()] = pieces[1].trim();
      }
    });
    return result;
  }

  function encodePartsParam(partsObj) {
    return PART_CATEGORIES.map(function (cat) {
      return cat.id + ':' + (partsObj[cat.id] || '');
    }).join(',');
  }

  function readFromUrlParams() {
    try {
      var params = new URLSearchParams(globalScope.location.search);
      if (!params.has('tier') && !params.has('sla') && !params.has('parts') && !params.has('buyer') && !params.has('pay')) {
        return null;
      }
      var addonsRaw = params.get('addons');
      var partsRaw = params.get('parts');
      var slaParam = params.get('sla') || DEFAULT_QUOTE.slaId;
      var buyerParam = params.get('buyer');
      if (!buyerParam) {
        buyerParam = (slaParam === 'studio-8' || slaParam === 'sme-15' || slaParam === 'clinic-25') ? 'b2b' : 'b2c';
      }
      return {
        schemaVersion: SCHEMA_VERSION,
        isCustom: true,
        updatedAt: new Date().toISOString(),
        activeQuote: {
          buyerType: buyerParam === 'b2b' ? 'b2b' : 'b2c',
          paymentPlan: params.get('pay') || DEFAULT_QUOTE.paymentPlan,
          tierId: params.get('tier') || DEFAULT_QUOTE.tierId,
          qty: params.get('qty') || 1,
          slaId: slaParam,
          parts: parsePartsParam(partsRaw),
          addons: addonsRaw ? addonsRaw.split(',').filter(Boolean) : [],
          detachedFromContact: false
        }
      };
    } catch (_err) {
      return null;
    }
  }

  var ProposalStore = {
    get: function () {
      var urlOverride = readFromUrlParams();
      if (urlOverride) {
        var sanitizedUrlState = sanitizeState(urlOverride);
        memoryFallbackState = sanitizedUrlState;
        return sanitizedUrlState;
      }

      try {
        var rawStr = globalScope.localStorage.getItem(STORAGE_KEY);
        if (!rawStr) {
          return sanitizeState({ isCustom: false, activeQuote: DEFAULT_QUOTE });
        }
        var parsed = JSON.parse(rawStr);
        if (!parsed || (parsed.schemaVersion !== SCHEMA_VERSION && parsed.schemaVersion !== 2 && parsed.schemaVersion !== 1)) {
          return sanitizeState({ isCustom: false, activeQuote: DEFAULT_QUOTE });
        }

        if (parsed.schemaVersion <= 2 && parsed.activeQuote && !parsed.activeQuote.buyerType) {
          parsed.activeQuote.buyerType = 'b2c';
          parsed.activeQuote.paymentPlan = 'split-70-30';
          if (parsed.activeQuote.slaId === 'studio-8') {
            parsed.activeQuote.slaId = 'none';
          }
        }
        return sanitizeState(parsed);
      } catch (_err) {
        storageRestricted = true;
        if (memoryFallbackState) {
          return sanitizeState(memoryFallbackState);
        }
        return sanitizeState({ isCustom: false, activeQuote: DEFAULT_QUOTE });
      }
    },

    save: function (partialState) {
      var current = ProposalStore.get();
      var nextQuote = Object.assign({}, current.activeQuote, partialState || {});
      var candidate = sanitizeState({
        schemaVersion: SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        isCustom: true,
        activeQuote: nextQuote
      });
      memoryFallbackState = candidate;

      try {
        globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          schemaVersion: candidate.schemaVersion,
          updatedAt: candidate.updatedAt,
          isCustom: candidate.isCustom,
          activeQuote: candidate.activeQuote
        }));
      } catch (_err) {
        storageRestricted = true;
      }
      updateGlobalTelemetryUI(candidate);
      return candidate;
    },

    reset: function () {
      var baseline = sanitizeState({
        schemaVersion: SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        isCustom: false,
        activeQuote: DEFAULT_QUOTE
      });
      memoryFallbackState = baseline;
      try {
        globalScope.localStorage.removeItem(STORAGE_KEY);
      } catch (_err) {
        storageRestricted = true;
      }
      updateGlobalTelemetryUI(baseline);
      return baseline;
    },

    getProvenanceLabel: function (state) {
      if (storageRestricted) {
        return 'Session Quote';
      }
      if (state && state.totals && state.totals.isPartsCustomized) {
        return 'Custom Parts Quote';
      }
      return state && state.isCustom
        ? 'Saved Quote'
        : 'Starting Quote';
    },

    buildQueryHref: function (pagePath, state) {
      var s = state || ProposalStore.get();
      var q = s.activeQuote;
      var params = new URLSearchParams();
      params.set('buyer', q.buyerType || 'b2c');
      params.set('pay', q.paymentPlan || 'split-70-30');
      params.set('tier', q.tierId);
      params.set('qty', String(q.qty));
      params.set('sla', q.slaId);
      if (s.totals && s.totals.isPartsCustomized) {
        params.set('parts', encodePartsParam(q.parts));
      }
      if (q.addons.length > 0) {
        params.set('addons', q.addons.join(','));
      }
      return pagePath + '?' + params.toString();
    }
  };

  function triggerPanelSwap(el) {
    if (!el || !el.classList) {
      return;
    }
    el.classList.remove('esd-panel-swap');
    if (typeof el.offsetWidth === 'number') {
      void el.offsetWidth;
    }
    el.classList.add('esd-panel-swap');
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) {
      var nextStr = String(value);
      if (el.textContent !== '' && el.textContent !== nextStr && el.classList) {
        el.classList.remove('esd-value-flash');
        if (typeof el.offsetWidth === 'number') {
          void el.offsetWidth;
        }
        el.classList.add('esd-value-flash');
      }
      el.textContent = nextStr;
    }
  }

  function updateGlobalTelemetryUI(state) {
    var s = state || ProposalStore.get();
    var t = s.totals;
    var navBadge = document.getElementById('nav-quote-pill');
    if (navBadge) {
      navBadge.textContent = 'Quote: ' + formatPhp(t.hardwareTotalPhp) + (t.monthlySlaPhp > 0 ? ' + ' + formatPhp(t.monthlySlaPhp) + '/mo' : '');
      navBadge.setAttribute('href', ProposalStore.buildQueryHref('/checkout', s));
    }

    var homeCheckoutLink = document.getElementById('home-checkout-link');
    if (homeCheckoutLink) {
      homeCheckoutLink.setAttribute('href', ProposalStore.buildQueryHref('/checkout', s));
    }

    setText('home-ledger-tier', t.displayTitle + ' (x' + t.qty + ')');
    setText('home-ledger-total', formatPhp(t.hardwareTotalPhp));
    setText('home-ledger-deposit', formatPhp(t.payment ? t.payment.downPaymentPhp : t.depositPhp));
    setText('home-ledger-sla', t.monthlySlaPhp > 0 ? formatPhp(t.monthlySlaPhp) + ' / mo' : 'Free 1-Yr Warranty (₱0/mo)');
    setText('home-ledger-status', ProposalStore.getProvenanceLabel(s));
  }

  function initNavAndWayfinding() {
    var currentPage = document.body.getAttribute('data-page') || 'index';
    var navLinks = document.querySelectorAll('.esd-navbar .nav-link[data-nav]');
    navLinks.forEach(function (link) {
      if (link.getAttribute('data-nav') === currentPage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });

    var sectionIndex = clampInt(document.body.getAttribute('data-section-num'), 1, 8, 1);
    var progressBar = document.getElementById('section-progress-bar');
    if (progressBar) {
      var pct = Math.round((sectionIndex / 8) * 100);
      progressBar.style.width = pct + '%';
      progressBar.setAttribute('aria-valuenow', String(pct));
    }

    updateGlobalTelemetryUI(ProposalStore.get());
  }

  function appendReceiptRow(container, labelText, valueText, labelColor) {
    var row = document.createElement('div');
    row.className = 'd-flex justify-content-between align-items-baseline gap-2 py-1';

    var left = document.createElement('span');
    left.style.color = labelColor || 'var(--esd-teal-tint)';
    left.textContent = labelText;

    var right = document.createElement('span');
    right.className = 'num-php text-nowrap';
    right.textContent = valueText;

    row.appendChild(left);
    row.appendChild(right);
    container.appendChild(row);
  }

  function renderPartsListElement(containerId, totals) {
    var container = document.getElementById(containerId);
    if (!container) {
      return;
    }
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    totals.partsBreakdown.forEach(function (item) {
      if (item.isDefaultOptional) {
        return;
      }
      appendReceiptRow(container, item.label + ': ' + item.name, formatPhp(item.pricePhp), 'var(--esd-teal-tint)');
    });

    if (Array.isArray(totals.addons)) {
      totals.addons.forEach(function (addonId) {
        var ad = PROPOSAL_CATALOG.addons[addonId];
        if (ad) {
          appendReceiptRow(container, 'Extra: ' + ad.name, formatPhp(ad.pricePhp), 'var(--esd-teal-tint)');
        }
      });
    }

    appendReceiptRow(container, 'Build & 24-Hour Stress Test Fee', formatPhp(totals.assemblyFeePhp), 'var(--esd-teal-subtle)');
  }

  function initServicesConfigurator() {
    var root = document.getElementById('services-configurator');
    if (!root) {
      return;
    }

    var tierRadios = root.querySelectorAll('input[name="buildTier"]');
    var buyerModeButtons = root.querySelectorAll('[data-buyer-mode]');
    var currentBuyerType = DEFAULT_QUOTE.buyerType;
    var presetButtons = document.querySelectorAll('[data-load-preset]');
    var slaSelect = document.getElementById('sla-select');
    var qtyInput = document.getElementById('build-qty');
    var addonChecks = root.querySelectorAll('input[name="addonItem"]');
    var resetBtn = document.getElementById('reset-quote-btn');
    var toCheckoutLink = document.getElementById('quote-to-checkout');
    var toFinancialsLink = document.getElementById('quote-to-financials');
    var toContactLink = document.getElementById('quote-to-contact');
    var catalogCategorySelect = document.getElementById('parts-catalog-category');
    var catalogSearchInput = document.getElementById('parts-catalog-search');
    var catalogCountEl = document.getElementById('parts-catalog-count');
    var catalogTbody = document.getElementById('parts-catalog-tbody');

    function buildAllCatalogEntries() {
      var list = [];
      PART_CATEGORIES.forEach(function (cat) {
        var items = PROPOSAL_CATALOG.parts[cat.id];
        Object.keys(items).forEach(function (partId) {
          var part = items[partId];
          list.push({
            categoryId: cat.id,
            categoryLabel: cat.label,
            selectId: cat.selectId,
            id: part.id,
            name: part.name,
            shortName: part.shortName,
            pricePhp: part.pricePhp,
            isAddon: false
          });
        });
      });
      Object.keys(PROPOSAL_CATALOG.addons).forEach(function (addonId) {
        var addon = PROPOSAL_CATALOG.addons[addonId];
        list.push({
          categoryId: 'addons',
          categoryLabel: 'Monitors & Extras',
          selectId: null,
          id: addon.id,
          name: addon.name,
          shortName: addon.name,
          pricePhp: addon.pricePhp,
          isAddon: true
        });
      });
      return list;
    }

    var allCatalogEntries = buildAllCatalogEntries();

    var FILTERED_COMPAT_CATEGORIES = {
      mobo: true,
      ram: true,
      cooler: true,
      psu: true,
      pcCase: true,
      fans: true,
      wifi: true
    };

    function populatePartSelects(activeParts) {
      PART_CATEGORIES.forEach(function (cat) {
        var selectEl = document.getElementById(cat.selectId);
        if (!selectEl) {
          return;
        }
        while (selectEl.firstChild) {
          selectEl.removeChild(selectEl.firstChild);
        }
        var items = PROPOSAL_CATALOG.parts[cat.id];
        var filterByCompat = Boolean(activeParts && FILTERED_COMPAT_CATEGORIES[cat.id]);
        Object.keys(items).forEach(function (partId) {
          if (filterByCompat && !isPartOptionCompatible(cat.id, partId, activeParts)) {
            return;
          }
          var part = items[partId];
          var opt = document.createElement('option');
          opt.value = part.id;
          opt.textContent = (part.shortName || part.name) + ' · ' + formatPhp(part.pricePhp);
          selectEl.appendChild(opt);
        });
      });
    }

    function renderCompatibilityStatus(compatInfo) {
      var statusEl = document.getElementById('build-compat-status');
      if (!statusEl || !compatInfo) {
        return;
      }
      var text = compatInfo.summaryText || '';
      if (compatInfo.adjustedLabels && compatInfo.adjustedLabels.length > 0) {
        text += ' · Auto-matched: ' + compatInfo.adjustedLabels.join(', ');
      }
      statusEl.textContent = text;
    }

    function populateCatalogCategorySelect() {
      if (!catalogCategorySelect) {
        return;
      }
      while (catalogCategorySelect.firstChild) {
        catalogCategorySelect.removeChild(catalogCategorySelect.firstChild);
      }
      var allOpt = document.createElement('option');
      allOpt.value = 'all';
      allOpt.textContent = 'All Categories (' + allCatalogEntries.length + ' items)';
      catalogCategorySelect.appendChild(allOpt);

      PART_CATEGORIES.forEach(function (cat) {
        var count = Object.keys(PROPOSAL_CATALOG.parts[cat.id]).length;
        var opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.label + ' (' + count + ')';
        catalogCategorySelect.appendChild(opt);
      });

      var addonsOpt = document.createElement('option');
      addonsOpt.value = 'addons';
      addonsOpt.textContent = 'Monitors, UPS & Peripherals (' + Object.keys(PROPOSAL_CATALOG.addons).length + ')';
      catalogCategorySelect.appendChild(addonsOpt);
      catalogCategorySelect.value = 'all';
    }

    function renderPartsCatalogBrowser(state) {
      if (!catalogTbody) {
        return;
      }
      var q = state.activeQuote;
      var activeCat = (catalogCategorySelect && catalogCategorySelect.value) ? catalogCategorySelect.value : 'all';
      var searchTerm = catalogSearchInput ? catalogSearchInput.value.trim().toLowerCase() : '';

      var filtered = allCatalogEntries.filter(function (entry) {
        if (activeCat !== 'all' && entry.categoryId !== activeCat) {
          return false;
        }
        if (!searchTerm) {
          return true;
        }
        var haystack = (entry.categoryLabel + ' ' + entry.name + ' ' + entry.shortName).toLowerCase();
        return haystack.indexOf(searchTerm) !== -1;
      });

      while (catalogTbody.firstChild) {
        catalogTbody.removeChild(catalogTbody.firstChild);
      }

      if (catalogCountEl) {
        catalogCountEl.textContent = 'Showing ' + filtered.length + ' of ' + allCatalogEntries.length + ' parts & extras';
      }

      if (filtered.length === 0) {
        var emptyRow = document.createElement('tr');
        var emptyCell = document.createElement('td');
        emptyCell.colSpan = 4;
        emptyCell.className = 'text-secondary py-3';
        emptyCell.textContent = 'No matching parts found. Clear the search box or switch category.';
        emptyRow.appendChild(emptyCell);
        catalogTbody.appendChild(emptyRow);
        return;
      }

      var frag = document.createDocumentFragment();
      filtered.forEach(function (entry) {
        var tr = document.createElement('tr');

        var catTd = document.createElement('td');
        catTd.className = 'font-mono-data small text-nowrap';
        catTd.textContent = entry.categoryLabel;

        var nameTd = document.createElement('td');
        nameTd.className = 'fw-semibold';
        nameTd.textContent = entry.name;

        var incompatReason = (!entry.isAddon && FILTERED_COMPAT_CATEGORIES[entry.categoryId])
          ? getPartIncompatReason(entry.categoryId, entry.id, q.parts)
          : null;
        var isPlatformSwitch = entry.categoryId === 'mobo' || entry.categoryId === 'ram';

        if (incompatReason) {
          var reasonDiv = document.createElement('div');
          reasonDiv.className = 'font-mono-data small fw-normal';
          reasonDiv.style.color = '#3D4040';
          reasonDiv.textContent = incompatReason;
          nameTd.appendChild(reasonDiv);
        }

        var priceTd = document.createElement('td');
        priceTd.className = 'num-php text-end fw-semibold text-nowrap';
        priceTd.textContent = entry.pricePhp === 0 ? '₱0 (Included)' : formatPhp(entry.pricePhp);

        var actionTd = document.createElement('td');
        actionTd.className = 'text-end text-nowrap';

        var isSelected = entry.isAddon
          ? q.addons.indexOf(entry.id) !== -1
          : q.parts[entry.categoryId] === entry.id;

        var btn = document.createElement('button');
        btn.type = 'button';
        if (incompatReason && !isPlatformSwitch && !isSelected) {
          btn.className = 'btn btn-ink-outline btn-sm';
          btn.disabled = true;
          btn.textContent = 'Incompatible';
        } else {
          btn.className = isSelected ? 'btn btn-teal btn-sm' : 'btn btn-ink-outline btn-sm';
          btn.textContent = entry.isAddon
            ? (isSelected ? 'Added' : 'Add Extra')
            : (isSelected ? 'In Build' : (incompatReason ? 'Switch Build' : 'Use Part'));
        }
        btn.addEventListener('click', function () {
          if (entry.isAddon) {
            addonChecks.forEach(function (box) {
              if (box.value === entry.id) {
                box.checked = !box.checked;
              }
            });
            collectAndSave(null, null, null, null);
          } else {
            collectAndSave(null, null, entry.categoryId, {
              categoryId: entry.categoryId,
              partId: entry.id
            });
          }
        });

        actionTd.appendChild(btn);
        tr.appendChild(catTd);
        tr.appendChild(nameTd);
        tr.appendChild(priceTd);
        tr.appendChild(actionTd);
        frag.appendChild(tr);
      });
      catalogTbody.appendChild(frag);
    }

    function updateBuyerModeUI(buyerType) {
      currentBuyerType = buyerType === 'b2b' ? 'b2b' : 'b2c';
      buyerModeButtons.forEach(function (btn) {
        var active = btn.getAttribute('data-buyer-mode') === currentBuyerType;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      setText(
        'buyer-mode-hint',
        currentBuyerType === 'b2b'
          ? 'Business (B2B): multi-PC orders, monthly IT plans & PO.'
          : 'Personal (B2C): 1 PC build · 1-yr free warranty · ₱0/mo.'
      );
    }

    function syncControlsFromState(state) {
      var q = state.activeQuote;
      updateBuyerModeUI(q.buyerType);
      tierRadios.forEach(function (radio) {
        radio.checked = radio.value === q.tierId;
      });
      PART_CATEGORIES.forEach(function (cat) {
        var selectEl = document.getElementById(cat.selectId);
        if (selectEl && q.parts[cat.id]) {
          selectEl.value = q.parts[cat.id];
        }
      });
      if (slaSelect) {
        slaSelect.value = q.slaId;
      }
      if (qtyInput) {
        qtyInput.value = String(q.qty);
      }
      addonChecks.forEach(function (box) {
        box.checked = q.addons.indexOf(box.value) !== -1;
      });
    }

    function renderQuoteSummary(state) {
      var t = state.totals;
      var pay = t.payment || computeCustomerPaymentPlan(t.hardwareTotalPhp, DEFAULT_QUOTE.paymentPlan);
      var downPct = Math.round(pay.plan.upFrontRatio * 100);
      setText('quote-tier-title', t.displayTitle + ' x ' + t.qty);
      setText('quote-tier-specs', t.specsSummary);
      renderPartsListElement('quote-parts-list', t);
      setText('quote-hardware-total', formatPhp(t.hardwareTotalPhp));
      setText('quote-deposit-label', 'Due Today (' + String(downPct) + '%)');
      setText('quote-deposit-due', formatPhp(pay.downPaymentPhp));
      setText(
        'quote-balance-label',
        pay.months > 0 ? 'Monthly (' + String(pay.months) + ' mos)' : 'Due on Pickup'
      );
      setText(
        'quote-balance-due',
        pay.months > 0 ? formatPhp(pay.monthlyInstallmentPhp) + ' / mo' : formatPhp(pay.pickupBalancePhp)
      );
      setText('quote-sla-monthly', t.monthlySlaPhp > 0 ? formatPhp(t.monthlySlaPhp) + ' / mo' : '₱0 / mo (Free Warranty)');
      setText('quote-sla-terms', t.sla.terms);
      setText('quote-provenance', ProposalStore.getProvenanceLabel(state));
      renderPartsCatalogBrowser(state);

      if (toCheckoutLink) {
        toCheckoutLink.setAttribute('href', ProposalStore.buildQueryHref('/checkout', state));
      }
      if (toFinancialsLink) {
        toFinancialsLink.setAttribute('href', ProposalStore.buildQueryHref('/financials', state) + '&view=buyer');
      }
      if (toContactLink) {
        toContactLink.setAttribute('href', ProposalStore.buildQueryHref('/contact', state));
      }
    }

    function collectSelectedParts() {
      var chosen = {};
      PART_CATEGORIES.forEach(function (cat) {
        var selectEl = document.getElementById(cat.selectId);
        if (selectEl && selectEl.value) {
          chosen[cat.id] = selectEl.value;
        }
      });
      return chosen;
    }

    function collectAndSave(resetPartsToTierId, paymentPlanOverride, changedPartCat, partOverride) {
      var selectedTier = resetPartsToTierId || DEFAULT_QUOTE.tierId;
      if (!resetPartsToTierId) {
        tierRadios.forEach(function (radio) {
          if (radio.checked) {
            selectedTier = radio.value;
          }
        });
      }
      var tierDef = PROPOSAL_CATALOG.tiers[selectedTier] || PROPOSAL_CATALOG.tiers[DEFAULT_QUOTE.tierId];
      var selectedParts = resetPartsToTierId
        ? Object.assign({}, tierDef.defaultParts)
        : collectSelectedParts();

      if (!resetPartsToTierId && partOverride && partOverride.categoryId && partOverride.partId) {
        selectedParts[partOverride.categoryId] = partOverride.partId;
      }

      var compatResult = reconcilePartsCompatibility(
        selectedParts,
        resetPartsToTierId ? null : (changedPartCat || null)
      );
      selectedParts = compatResult.parts;

      var selectedAddons = [];
      addonChecks.forEach(function (box) {
        if (box.checked) {
          selectedAddons.push(box.value);
        }
      });

      var patch = {
        buyerType: currentBuyerType,
        tierId: selectedTier,
        parts: selectedParts,
        qty: qtyInput ? clampInt(qtyInput.value, 1, 10, 1) : 1,
        slaId: slaSelect ? slaSelect.value : DEFAULT_QUOTE.slaId,
        addons: selectedAddons,
        detachedFromContact: false
      };
      if (paymentPlanOverride) {
        patch.paymentPlan = paymentPlanOverride;
      }

      var nextState = ProposalStore.save(patch);
      populatePartSelects(nextState.activeQuote.parts);
      syncControlsFromState(nextState);
      renderCompatibilityStatus(compatResult);
      renderQuoteSummary(nextState);
    }

    populateCatalogCategorySelect();
    var initialState = ProposalStore.get();
    var initialCompat = reconcilePartsCompatibility(initialState.activeQuote.parts, null);
    populatePartSelects(initialState.activeQuote.parts);
    syncControlsFromState(initialState);
    renderCompatibilityStatus(initialCompat);
    renderQuoteSummary(initialState);

    buyerModeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetMode = btn.getAttribute('data-buyer-mode') === 'b2b' ? 'b2b' : 'b2c';
        var cur = ProposalStore.get().activeQuote;
        var nextPlan = cur.paymentPlan;
        updateBuyerModeUI(targetMode);
        if (targetMode === 'b2c') {
          if (slaSelect && (slaSelect.value === 'studio-8' || slaSelect.value === 'sme-15' || slaSelect.value === 'clinic-25')) {
            slaSelect.value = 'none';
          }
          if (qtyInput && clampInt(qtyInput.value, 1, 10, 1) > 1) {
            qtyInput.value = '1';
          }
          if (cur.paymentPlan === 'b2b-po') {
            nextPlan = 'split-70-30';
          }
        } else {
          if (slaSelect && (slaSelect.value === 'none' || slaSelect.value === 'b2c-care')) {
            slaSelect.value = 'studio-8';
          }
          if (cur.paymentPlan === 'split-70-30') {
            nextPlan = 'b2b-po';
          }
        }
        collectAndSave(null, nextPlan);
      });
    });

    tierRadios.forEach(function (r) {
      r.addEventListener('change', function () {
        collectAndSave(r.value);
      });
    });

    presetButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetTier = btn.getAttribute('data-load-preset');
        if (targetTier && PROPOSAL_CATALOG.tiers[targetTier]) {
          collectAndSave(targetTier);
        }
      });
    });

    PART_CATEGORIES.forEach(function (cat) {
      var selectEl = document.getElementById(cat.selectId);
      if (selectEl) {
        selectEl.addEventListener('change', function () {
          collectAndSave(null, null, cat.id, null);
        });
      }
    });

    addonChecks.forEach(function (c) {
      c.addEventListener('change', function () {
        collectAndSave(null);
      });
    });
    if (slaSelect) {
      slaSelect.addEventListener('change', function () {
        collectAndSave(null);
      });
    }
    if (qtyInput) {
      qtyInput.addEventListener('input', function () {
        collectAndSave(null);
      });
      qtyInput.addEventListener('change', function () {
        qtyInput.value = String(clampInt(qtyInput.value, 1, 10, 1));
        collectAndSave(null);
      });
    }
    if (catalogCategorySelect) {
      catalogCategorySelect.addEventListener('change', function () {
        renderPartsCatalogBrowser(ProposalStore.get());
      });
    }
    if (catalogSearchInput) {
      catalogSearchInput.addEventListener('input', function () {
        renderPartsCatalogBrowser(ProposalStore.get());
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var resetState = ProposalStore.reset();
        var resetCompat = reconcilePartsCompatibility(resetState.activeQuote.parts, null);
        populatePartSelects(resetState.activeQuote.parts);
        syncControlsFromState(resetState);
        renderCompatibilityStatus(resetCompat);
        renderQuoteSummary(resetState);
      });
    }

    var saveBuildBtn = document.getElementById('save-build-account-btn');
    var saveBuildFeedback = document.getElementById('save-build-feedback');
    if (saveBuildBtn) {
      saveBuildBtn.addEventListener('click', function () {
        var curState = ProposalStore.get();
        var tot = curState.totals;
        var pay = tot.payment || computeCustomerPaymentPlan(tot.hardwareTotalPhp, curState.activeQuote.paymentPlan);
        if (saveBuildFeedback) {
          saveBuildFeedback.textContent = 'Saving to account...';
        }
        saveAccountPurchase({
          itemKind: 'saved_quote',
          orderRef: 'NV-BLD-' + String(Math.floor(1000 + (Date.now() % 9000))),
          buildTitle: tot.displayTitle,
          qty: tot.qty,
          hardwareTotalPhp: tot.hardwareTotalPhp,
          dueTodayPhp: pay.downPaymentPhp,
          paymentPlan: pay.plan.shortName,
          slaLabel: tot.monthlySlaPhp > 0 ? tot.sla.name + ' (' + formatPhp(tot.monthlySlaPhp) + '/mo)' : 'Free 1-Yr Warranty',
          statusLabel: 'Saved Build',
          quoteState: curState.activeQuote
        }).then(function (res) {
          if (res.status === 401) {
            if (saveBuildFeedback) {
              saveBuildFeedback.innerHTML = 'Sign in with 2FA required — <a href="/account" class="text-white text-decoration-underline">Open Account</a>';
            }
            return;
          }
          if (!res.ok) {
            if (saveBuildFeedback) {
              saveBuildFeedback.textContent = (res.data && res.data.error) || 'Unable to save build.';
            }
            return;
          }
          if (saveBuildFeedback) {
            saveBuildFeedback.innerHTML = 'Saved to account — <a href="/account" class="text-white text-decoration-underline">View Vault</a>';
          }
        });
      });
    }
  }

  function initMarketCalculator() {
    var root = document.getElementById('market-estimator');
    if (!root) {
      return;
    }

    var segments = {
      students: {
        title: 'Personal & Student Builds (B2C)',
        model: '1-Time PC Purchase (₱0/mo)',
        profile: 'College CAD/coding students, gamers, and home buyers around Katipunan.',
        pain: 'Mall prebuilts cost more for weaker parts.',
        ticket: '₱44,500 – ₱62,500',
        retention: 'Free 1-yr store warranty',
        ctaHref: '/services?buyer=b2c&tier=campus-cad&qty=1&sla=none',
        ctaLabel: 'Build a Personal PC →'
      },
      studios: {
        title: 'Creative & Design Studios (B2B)',
        model: 'Builds + Optional Monthly Care',
        profile: 'Architecture, video, and 3D teams (4–12 PCs) on tight deadlines.',
        pain: 'Cannot lose weeks waiting on parts warranty.',
        ticket: '₱62,500 – ₱96,000 / PC',
        retention: '4-hr visits + free loaner PC',
        ctaHref: '/services?buyer=b2b&tier=studio-render&qty=4&sla=studio-8',
        ctaLabel: 'Build a Studio Quote →'
      },
      smes: {
        title: 'Clinics & Small Offices (B2B)',
        model: 'Monthly IT Plan or Multi-PC Upgrade',
        profile: 'Medical clinics, accounting offices, and review centers (10–25 PCs).',
        pain: 'Corporate IT contracts start too high for small teams.',
        ticket: '₱19,500 – ₱29,000 / mo',
        retention: 'Monthly checkups + same-day local support',
        ctaHref: '/services?buyer=b2b&tier=campus-cad&qty=5&sla=sme-15',
        ctaLabel: 'See Office Plans →'
      }
    };

    var marketTabButtons = root.querySelectorAll('[data-market-tab]');
    var customerSection = document.getElementById('market-customer-section');
    var proposalSection = document.getElementById('market-proposal-section');
    var segButtons = root.querySelectorAll('[data-segment]');
    var firmsSlider = document.getElementById('market-firms-range');
    var captureSlider = document.getElementById('market-capture-range');
    var avgValueInput = document.getElementById('market-annual-arpu');

    function setMarketTab(mode) {
      var activeMode = (mode === 'customer' || mode === 'business') ? mode : 'both';
      marketTabButtons.forEach(function (btn) {
        var active = btn.getAttribute('data-market-tab') === activeMode;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (customerSection) {
        customerSection.classList.toggle('d-none', activeMode === 'business');
      }
      if (proposalSection) {
        proposalSection.classList.toggle('d-none', activeMode === 'customer');
      }
      triggerPanelSwap(activeMode === 'business' ? proposalSection : customerSection);
    }

    function showSegment(key) {
      var item = segments[key] || segments.students;
      segButtons.forEach(function (btn) {
        var active = btn.getAttribute('data-segment') === key;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      setText('seg-title', item.title);
      setText('seg-model', item.model);
      setText('seg-profile', item.profile);
      setText('seg-pain', item.pain);
      setText('seg-ticket', item.ticket);
      setText('seg-retention', item.retention);
      var segCta = document.getElementById('seg-cta-link');
      if (segCta) {
        segCta.setAttribute('href', item.ctaHref);
        segCta.textContent = item.ctaLabel;
      }
      var segTitleEl = document.getElementById('seg-title');
      triggerPanelSwap(segTitleEl && segTitleEl.parentNode);
    }

    function recalcTamSamSom() {
      var corridorEntities = clampInt(firmsSlider ? firmsSlider.value : 420, 150, 1200, 420);
      var capturePct = clampFloat(captureSlider ? captureSlider.value : 6, 1, 20, 6);
      var annualArpu = clampInt(avgValueInput ? avgValueInput.value : 118000, 40000, 350000, 118000);

      var tamAnnual = corridorEntities * 4.5 * annualArpu;
      var samAnnual = corridorEntities * annualArpu;
      var somClients = Math.max(1, Math.round(corridorEntities * (capturePct / 100)));
      var somAnnual = somClients * annualArpu;

      setText('market-firms-out', String(corridorEntities) + ' local buyers');
      setText('market-capture-out', capturePct.toFixed(1) + '%');
      setText('market-tam-out', formatPhp(tamAnnual));
      setText('market-sam-out', formatPhp(samAnnual));
      setText(
        'market-som-out',
        formatPhp(somAnnual) + ' / yr (' + somClients + ' buyers · ~' + Math.max(1, Math.round(somClients / 12)) + '/mo)'
      );
    }

    marketTabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMarketTab(btn.getAttribute('data-market-tab'));
      });
    });

    segButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        showSegment(btn.getAttribute('data-segment'));
      });
    });

    if (firmsSlider) { firmsSlider.addEventListener('input', recalcTamSamSom); }
    if (captureSlider) { captureSlider.addEventListener('input', recalcTamSamSom); }
    if (avgValueInput) { avgValueInput.addEventListener('input', recalcTamSamSom); }

    setMarketTab('both');
    showSegment('students');
    recalcTamSamSom();
  }

  function initMarketingEstimator() {
    var root = document.getElementById('marketing-calculator');
    if (!root) {
      return;
    }

    var campusSpend = document.getElementById('mkt-campus-spend');
    var searchSpend = document.getElementById('mkt-search-spend');
    var b2bSpend = document.getElementById('mkt-b2b-spend');
    var convSlider = document.getElementById('mkt-conv-rate');

    function recalcMarketing() {
      var cSpend = clampInt(campusSpend ? campusSpend.value : 3500, 0, 30000, 3500);
      var sSpend = clampInt(searchSpend ? searchSpend.value : 3000, 0, 30000, 3000);
      var bSpend = clampInt(b2bSpend ? b2bSpend.value : 2500, 0, 30000, 2500);
      var closeRatePct = clampFloat(convSlider ? convSlider.value : 18, 5, 45, 18);

      var totalBudget = cSpend + sSpend + bSpend;

      var leadsCampus = Math.round(cSpend / 220);
      var leadsSearch = Math.round(sSpend / 190);
      var leadsB2B = Math.round(bSpend / 420);
      var totalLeads = leadsCampus + leadsSearch + leadsB2B;
      var wonClients = Math.max(1, Math.round(totalLeads * (closeRatePct / 100)));

      var cac = totalBudget > 0 ? Math.round(totalBudget / wonClients) : 0;

      var blended12mLtv = 46800;
      var ltvCacRatio = cac > 0 ? (blended12mLtv / cac).toFixed(1) + 'x' : 'Organic (₱0 CAC)';

      setText('mkt-campus-out', formatPhp(cSpend));
      setText('mkt-search-out', formatPhp(sSpend));
      setText('mkt-b2b-out', formatPhp(bSpend));
      setText('mkt-conv-out', closeRatePct.toFixed(0) + '%');
      setText('mkt-total-budget', formatPhp(totalBudget) + ' / mo');
      setText('mkt-leads-out', String(totalLeads) + ' / mo');
      setText('mkt-won-out', String(wonClients) + ' / mo');
      setText('mkt-cac-out', formatPhp(cac));
      setText('mkt-ltv-ratio', ltvCacRatio);
    }

    [campusSpend, searchSpend, b2bSpend, convSlider].forEach(function (el) {
      if (el) { el.addEventListener('input', recalcMarketing); }
    });
    recalcMarketing();
  }

  function initOperationsWorkflow() {
    var root = document.getElementById('operations-console');
    if (!root) {
      return;
    }

    var stages = {
      '1': {
        code: 'Step 1 of 7',
        title: 'Choose Workload & Check Parts List',
        owner: 'Head Builder',
        duration: 'Same day',
        output: 'We review your software needs and check that every part (power supply, case clearance, and memory speed) fits cleanly.'
      },
      '2': {
        code: 'Step 2 of 7',
        title: '70% Down Payment & Parts Order',
        owner: 'Purchasing Desk',
        duration: 'Days 1–2',
        output: 'Your 70% down payment pays for the brand-new parts from Manila distributors; official receipts and serial numbers are logged.'
      },
      '3': {
        code: 'Step 3 of 7',
        title: 'Static-Safe Assembly & Airflow Setup',
        owner: 'PC Technician',
        duration: 'Day 3',
        output: 'Built on grounded anti-static mats with clean rear cable routing and quiet fan curves.'
      },
      '4': {
        code: 'Step 4 of 7',
        title: '24-Hour Stress & Temperature Test',
        owner: 'QA Test Bench',
        duration: 'Day 4 (24 hrs)',
        output: 'Every PC runs a 4-hour memory check and a 12-hour CPU/GPU full-load heat test before approval.'
      },
      '5': {
        code: 'Step 5 of 7',
        title: 'Printed Test Report & Warranty List',
        owner: 'PC Technician',
        duration: 'Day 4 afternoon',
        output: 'Printed temperature and speed check results packed together with your part serial numbers and boxes.'
      },
      '6': {
        code: 'Step 6 of 7',
        title: '30% Pickup Balance & Live Boot Check',
        owner: 'Technician / Customer',
        duration: 'Day 5',
        output: 'You inspect the PC running in person and pay the remaining 30% on pickup or delivery.'
      },
      '7': {
        code: 'Step 7 of 7',
        title: 'Ongoing Support & Loaner Protection',
        owner: 'Support Team',
        duration: 'Monthly plan',
        output: 'Scheduled cleanups, software updates, and free loaner PCs for office plan subscribers during factory repairs.'
      }
    };

    var scenarios = {
      'os-crash': {
        severity: 'Priority 2 — PC Not Booting / Driver Crash',
        triage: '15-Min Phone or Screen-Share Help',
        dispatch: '4-Hr On-Site Visit (if remote fix fails)',
        loaner: 'Not Needed (Fixed via Driver / Windows Repair)',
        coverage: 'Included in Monthly Support Plan'
      },
      'dead-gpu': {
        severity: 'Priority 1 — Broken Graphics Card / Hardware Fault',
        triage: '15-Min Remote Check & Error Review',
        dispatch: 'Within 4 Hours (Within 8 km)',
        loaner: 'Free Loaner PC Provided (Office & Clinic Plans)',
        coverage: 'Labor & Loaner Included; Distributor Replaces Faulty Part'
      },
      'network-down': {
        severity: 'Priority 1 — Office Internet / Router Down',
        triage: 'Immediate Call + Line Check',
        dispatch: 'Priority 2-Hr On-Site Visit',
        loaner: 'Temporary Backup Router Provided',
        coverage: 'Tech Labor Covered; Replacement Hardware Billed at Cost'
      },
      'new-hire': {
        severity: 'Priority 3 — New Staff PC Setup',
        triage: 'Same-Day Request Logged',
        dispatch: 'Handled on Next Scheduled Office Visit',
        loaner: 'Not Applicable',
        coverage: 'Included Within Plan PC Limit'
      }
    };

    var stageButtons = root.querySelectorAll('[data-stage]');
    function selectStage(id) {
      var st = stages[id] || stages['1'];
      stageButtons.forEach(function (b) {
        var active = b.getAttribute('data-stage') === id;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      setText('ops-stage-code', st.code);
      setText('ops-stage-title', st.title);
      setText('ops-stage-owner', st.owner);
      setText('ops-stage-duration', st.duration);
      setText('ops-stage-output', st.output);
      var opsTitleEl = document.getElementById('ops-stage-title');
      triggerPanelSwap(opsTitleEl && opsTitleEl.parentNode);
    }

    stageButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectStage(btn.getAttribute('data-stage'));
      });
    });

    var ticketSelect = document.getElementById('sla-ticket-scenario');
    function updateTicketTriage() {
      var key = ticketSelect ? ticketSelect.value : 'os-crash';
      var sc = scenarios[key] || scenarios['os-crash'];
      setText('triage-severity', sc.severity);
      setText('triage-remote', sc.triage);
      setText('triage-dispatch', sc.dispatch);
      setText('triage-loaner', sc.loaner);
      setText('triage-coverage', sc.coverage);
    }

    if (ticketSelect) {
      ticketSelect.addEventListener('change', updateTicketTriage);
    }

    selectStage('1');
    updateTicketTriage();
  }

  function renderCashFlowChart(monthsArray) {
    var svg = document.getElementById('cashflow-svg');
    if (!svg) {
      return;
    }

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    var ns = 'http://www.w3.org/2000/svg';
    var w = 680;
    var h = 250;
    var padLeft = 68;
    var padRight = 24;
    var padTop = 24;
    var padBottom = 34;
    var plotW = w - padLeft - padRight;
    var plotH = h - padTop - padBottom;

    var minVal = -PROPOSAL_CATALOG.capexTotalPhp;
    var maxVal = 0;
    monthsArray.forEach(function (m) {
      if (m.cumulativePhp < minVal) { minVal = m.cumulativePhp; }
      if (m.cumulativePhp > maxVal) { maxVal = m.cumulativePhp; }
    });
    if (maxVal < 150000) { maxVal = 150000; }
    var span = Math.max(1, maxVal - minVal);

    function yPos(val) {
      return padTop + ((maxVal - val) / span) * plotH;
    }

    function xPos(idx) {
      return padLeft + (idx / Math.max(1, monthsArray.length - 1)) * plotW;
    }

    var zeroY = yPos(0);
    var zeroLine = document.createElementNS(ns, 'line');
    zeroLine.setAttribute('x1', String(padLeft));
    zeroLine.setAttribute('x2', String(w - padRight));
    zeroLine.setAttribute('y1', zeroY.toFixed(1));
    zeroLine.setAttribute('y2', zeroY.toFixed(1));
    zeroLine.setAttribute('stroke', '#131B1E');
    zeroLine.setAttribute('stroke-width', '1.5');
    zeroLine.setAttribute('stroke-dasharray', '4 3');
    svg.appendChild(zeroLine);

    var zeroLabel = document.createElementNS(ns, 'text');
    zeroLabel.setAttribute('x', '8');
    zeroLabel.setAttribute('y', (zeroY + 4).toFixed(1));
    zeroLabel.setAttribute('fill', '#131B1E');
    zeroLabel.setAttribute('font-size', '11');
    zeroLabel.setAttribute('font-family', 'monospace');
    zeroLabel.textContent = '₱0';
    svg.appendChild(zeroLabel);

    var points = monthsArray.map(function (m, idx) {
      return xPos(idx).toFixed(1) + ',' + yPos(m.cumulativePhp).toFixed(1);
    }).join(' ');

    var polyline = document.createElementNS(ns, 'polyline');
    polyline.setAttribute('class', 'esd-chart-line');
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', '#0D3A40');
    polyline.setAttribute('stroke-width', '3');
    polyline.setAttribute('points', points);
    svg.appendChild(polyline);

    monthsArray.forEach(function (m, idx) {
      var cx = xPos(idx);
      var cy = yPos(m.cumulativePhp);
      var dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('class', 'esd-chart-dot');
      dot.setAttribute('cx', cx.toFixed(1));
      dot.setAttribute('cy', cy.toFixed(1));
      dot.setAttribute('r', '4.5');
      dot.setAttribute('fill', m.cumulativePhp >= 0 ? '#166534' : '#B94417');
      dot.setAttribute('stroke', '#FFFFFF');
      dot.setAttribute('stroke-width', '1.5');
      svg.appendChild(dot);

      var mText = document.createElementNS(ns, 'text');
      mText.setAttribute('x', cx.toFixed(1));
      mText.setAttribute('y', String(h - 10));
      mText.setAttribute('text-anchor', 'middle');
      mText.setAttribute('font-size', '11');
      mText.setAttribute('font-family', 'monospace');
      mText.setAttribute('fill', '#3A4649');
      mText.textContent = 'M' + m.month;
      svg.appendChild(mText);
    });
  }

  function initCustomerPaymentCalculator() {
    var calcRoot = document.getElementById('customer-payment-calculator');
    var customerSection = document.getElementById('customer-payment-section');
    var businessSection = document.getElementById('business-proposal-section');
    var viewTabButtons = document.querySelectorAll('[data-fin-tab]');

    function applyViewTab(tabName) {
      var mode = tabName === 'customer' || tabName === 'business' ? tabName : 'both';
      viewTabButtons.forEach(function (btn) {
        var active = btn.getAttribute('data-fin-tab') === mode;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (customerSection) {
        customerSection.classList.toggle('d-none', mode === 'business');
      }
      if (businessSection) {
        businessSection.classList.toggle('d-none', mode === 'customer');
      }
      triggerPanelSwap(mode === 'business' ? businessSection : customerSection);
    }

    var initialViewParam = 'both';
    try {
      var urlParams = new URLSearchParams(globalScope.location.search);
      if (urlParams.get('view') === 'buyer') {
        initialViewParam = 'customer';
      }
    } catch (_err) {
      initialViewParam = 'both';
    }
    applyViewTab(initialViewParam);

    viewTabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyViewTab(btn.getAttribute('data-fin-tab'));
      });
    });

    if (!calcRoot) {
      return;
    }

    var buyerButtons = calcRoot.querySelectorAll('[data-fin-buyer]');
    var planButtons = calcRoot.querySelectorAll('[data-pay-plan]');
    var checkoutLink = document.getElementById('pay-checkout-link');
    var editBuildLink = document.getElementById('pay-edit-build-link');

    function renderCustomerPayment(state) {
      var s = state || ProposalStore.get();
      var q = s.activeQuote;
      var t = s.totals;
      var p = t.payment || computeCustomerPaymentPlan(t.hardwareTotalPhp, q.paymentPlan);
      var downPct = Math.round(p.plan.upFrontRatio * 100);

      buyerButtons.forEach(function (btn) {
        var active = btn.getAttribute('data-fin-buyer') === t.buyerType;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      planButtons.forEach(function (btn) {
        var active = btn.getAttribute('data-pay-plan') === p.plan.id;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      setText(
        'pay-buyer-badge',
        t.buyerType === 'b2b' ? 'Business (B2B)' : 'Personal (B2C)'
      );
      setText('pay-quote-name', t.displayTitle + ' x ' + t.qty);
      setText('pay-quote-specs', t.specsSummary);
      setText('pay-hardware-total', formatPhp(t.hardwareTotalPhp));
      setText(
        'pay-installment-fee',
        p.installmentFeePhp > 0 ? '+' + formatPhp(p.installmentFeePhp) : '₱0 (0% Fee)'
      );
      setText('pay-total-payable', formatPhp(p.totalPayablePhp));
      setText('pay-due-today-label', 'Paid / Down Today (' + downPct + '%)');
      setText('pay-due-today', formatPhp(p.downPaymentPhp));

      if (p.months > 0) {
        setText('pay-completion-label', 'Due on Pickup');
        setText('pay-completion', '₱0');
        setText(
          'pay-monthly-installment',
          formatPhp(p.monthlyInstallmentPhp) + ' / mo (' + String(p.months) + ' mos)'
        );
      } else {
        setText(
          'pay-completion-label',
          'Due on ' + (t.buyerType === 'b2b' ? 'Delivery' : 'Pickup') + ' (' + (100 - downPct) + '%)'
        );
        setText('pay-completion', formatPhp(p.pickupBalancePhp));
        setText('pay-monthly-installment', '₱0 / mo');
      }

      setText(
        'pay-support-monthly',
        t.monthlySlaPhp > 0 ? formatPhp(t.monthlySlaPhp) + ' / mo (' + t.sla.name + ')' : '₱0 / mo (1-Yr Free Warranty)'
      );

      var noteText = '';
      if (p.months > 0) {
        noteText = String(p.months) + ' monthly payments of ' + formatPhp(p.monthlyInstallmentPhp) +
          (p.installmentFeePhp === 0 ? ' (0% interest)' : ' (' + Math.round(p.plan.feeRate * 100) + '% fee included)') +
          ' after ' + downPct + '% down (' + formatPhp(p.downPaymentPhp) + ').';
      } else if (p.plan.id === 'b2b-po') {
        noteText = '50% down (' + formatPhp(p.downPaymentPhp) + '), 50% on delivery (' + formatPhp(p.pickupBalancePhp) + ') with BIR Invoice.';
      } else {
        noteText = '70% down (' + formatPhp(p.downPaymentPhp) + '), 30% on pickup (' + formatPhp(p.pickupBalancePhp) + ').';
      }
      setText('pay-plan-note', noteText);

      if (checkoutLink) {
        checkoutLink.setAttribute('href', ProposalStore.buildQueryHref('/checkout', s));
      }
      if (editBuildLink) {
        editBuildLink.setAttribute('href', ProposalStore.buildQueryHref('/services', s));
      }
    }

    buyerButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var nextBuyer = btn.getAttribute('data-fin-buyer') === 'b2b' ? 'b2b' : 'b2c';
        var cur = ProposalStore.get().activeQuote;
        var patch = { buyerType: nextBuyer };
        if (nextBuyer === 'b2b' && cur.paymentPlan === 'split-70-30') {
          patch.paymentPlan = 'b2b-po';
        }
        if (nextBuyer === 'b2c' && cur.paymentPlan === 'b2b-po') {
          patch.paymentPlan = 'split-70-30';
        }
        renderCustomerPayment(ProposalStore.save(patch));
      });
    });

    planButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var planId = btn.getAttribute('data-pay-plan');
        if (planId && PROPOSAL_CATALOG.paymentPlans[planId]) {
          renderCustomerPayment(ProposalStore.save({ paymentPlan: planId }));
        }
      });
    });

    renderCustomerPayment(ProposalStore.get());
  }

  function initFinancialSimulator() {
    var root = document.getElementById('financial-simulator');
    if (!root) {
      return;
    }

    initCustomerPaymentCalculator();

    var buildsSlider = document.getElementById('fin-builds-mo');
    var retainersSlider = document.getElementById('fin-retainers-mo');
    var marginSlider = document.getElementById('fin-margin-pct');
    var rmaSlider = document.getElementById('fin-rma-pct');
    var taxSelect = document.getElementById('fin-tax-regime');
    var importBenchmarkBtn = document.getElementById('fin-import-quote-btn');
    var resetBaselineBtn = document.getElementById('fin-reset-baseline-btn');

    var useImportedBenchmark = false;

    function recalcFinancials() {
      var storeState = ProposalStore.get();
      var qTotals = storeState.totals;

      var monthlyBuilds = clampInt(buildsSlider ? buildsSlider.value : 9, 0, 30, 9);
      var activeRetainers = clampInt(retainersSlider ? retainersSlider.value : 5, 0, 25, 5);
      var buildMarginPct = clampFloat(marginSlider ? marginSlider.value : 17, 6, 28, 17);
      var rmaReservePct = clampFloat(rmaSlider ? rmaSlider.value : 3, 0, 8, 3);
      var taxMode = taxSelect ? taxSelect.value : 'nonvat-8';

      var avgUnitBuildPrice = useImportedBenchmark ? qTotals.unitBuildTotalPhp : 62500;
      var avgRetainerPrice = (useImportedBenchmark && qTotals.monthlySlaPhp > 0) ? qTotals.monthlySlaPhp : 15500;
      var avgRetainerDirectCost = Math.round(avgRetainerPrice * 0.25);

      var monthlyGrossHardware = monthlyBuilds * avgUnitBuildPrice;
      var monthlyGrossSla = activeRetainers * avgRetainerPrice;
      var totalMonthlyGross = monthlyGrossHardware + monthlyGrossSla;
      var annualizedGross = totalMonthlyGross * 12;

      var netBuildMarginRate = (buildMarginPct - rmaReservePct) / 100;
      var monthlyBuildNetMargin = monthlyGrossHardware * netBuildMarginRate;
      var monthlySlaNetMargin = monthlyGrossSla - (activeRetainers * avgRetainerDirectCost);
      var totalMonthlyContribution = monthlyBuildNetMargin + monthlySlaNetMargin;

      var estSeats = activeRetainers * 9;
      var needsSecondTech = (monthlyBuilds > PROPOSAL_CATALOG.singleTechMaxBuilds) || (estSeats > PROPOSAL_CATALOG.singleTechMaxSeats);
      var effectiveFixedOpex = PROPOSAL_CATALOG.fixedOpexBasePhp + (needsSecondTech ? PROPOSAL_CATALOG.secondTechStepPhp : 0);

      var preTaxOperatingIncome = totalMonthlyContribution - effectiveFixedOpex;
      var monthlyTaxPhp = 0;
      var taxNote = '';
      if (taxMode === 'nonvat-8') {
        var taxableBase = Math.max(0, totalMonthlyGross - (250000 / 12));
        monthlyTaxPhp = Math.round(taxableBase * 0.08);
        taxNote = '8% Optional Non-VAT Tax (over ₱250k annual exempt threshold)';
      } else if (taxMode === 'nonvat-3') {
        monthlyTaxPhp = Math.round(totalMonthlyGross * 0.03) + Math.max(0, Math.round(preTaxOperatingIncome * 0.15));
        taxNote = '3% Percentage Tax on Gross + Est. Income Tax';
      } else {

        var netVatRemitted = Math.max(0, Math.round(totalMonthlyContribution * (0.12 / 1.12)));
        monthlyTaxPhp = netVatRemitted + Math.max(0, Math.round((preTaxOperatingIncome - netVatRemitted) * 0.20));
        taxNote = '12% VAT Net Value-Add Remittance (Input VAT Credited) + Corporate/Graduated Tax';
      }

      var monthlyNetProfit = preTaxOperatingIncome - monthlyTaxPhp;

      var opBreakEvenText = '';
      var paybackText = '';
      if (totalMonthlyContribution <= 0) {
        opBreakEvenText = 'No Break-Even (Negative Monthly Margin)';
        paybackText = 'Unreachable at current margin %';
      } else {
        var perUnitCombinedContribution = monthlyBuilds > 0
          ? (avgUnitBuildPrice * netBuildMarginRate)
          : avgRetainerPrice * 0.75;
        if (perUnitCombinedContribution <= 0) {
          opBreakEvenText = 'No Break-Even (Build Margin <= RMA Reserve)';
        } else {
          var remainingOpexAfterSla = Math.max(0, effectiveFixedOpex - monthlySlaNetMargin);
          var neededBuilds = Math.ceil(remainingOpexAfterSla / Math.max(1, avgUnitBuildPrice * netBuildMarginRate));
          opBreakEvenText = monthlySlaNetMargin >= effectiveFixedOpex
            ? '0 PCs Needed (Support Plans Cover Fixed Costs)'
            : String(neededBuilds) + ' PCs/Mo (with ' + activeRetainers + ' Support Plans)';
        }

        if (monthlyNetProfit <= 0) {
          paybackText = 'Not Paying Back (Monthly Profit <= ₱0)';
        } else {
          var monthsToPayback = Math.ceil(PROPOSAL_CATALOG.capexTotalPhp / monthlyNetProfit);
          paybackText = String(monthsToPayback) + ' Months to Recover ₱345,000 Startup Cost';
        }
      }

      setText('fin-builds-val', String(monthlyBuilds) + ' PCs/mo');
      setText('fin-retainers-val', String(activeRetainers) + ' offices (~' + estSeats + ' PCs)');
      setText('fin-margin-val', buildMarginPct.toFixed(1) + '%');
      setText('fin-rma-val', rmaReservePct.toFixed(1) + '%');
      setText('fin-context-badge', useImportedBenchmark
        ? 'Using Your Saved Build: ' + qTotals.displayTitle + ' (' + formatPhp(avgUnitBuildPrice) + ')'
        : 'Default Studio Estimates');

      setText('fin-gross-billings', formatPhp(totalMonthlyGross));
      setText('fin-hardware-cogs', formatPhp(monthlyGrossHardware * (1 - (buildMarginPct / 100))));
      setText('fin-rma-reserve', formatPhp(monthlyGrossHardware * (rmaReservePct / 100)));
      setText('fin-gross-margin-total', formatPhp(totalMonthlyContribution));
      setText('fin-opex-effective', formatPhp(effectiveFixedOpex));
      setText('fin-tax-estimated', formatPhp(monthlyTaxPhp));
      setText('fin-net-profit', formatPhp(monthlyNetProfit));
      setText('fin-breakeven-out', opBreakEvenText);
      setText('fin-payback-out', paybackText);
      setText('fin-tax-footnote', taxNote);

      var vatAlert = document.getElementById('fin-vat-alert');
      if (vatAlert) {
        var exceedsVatCliff = annualizedGross >= PROPOSAL_CATALOG.vatCliffAnnualPhp && taxMode !== 'vat-12';
        vatAlert.classList.toggle('d-none', !exceedsVatCliff);
        if (exceedsVatCliff) {
          vatAlert.textContent = 'BIR ₱3M VAT Threshold Notice: Annualized gross sales (' + formatPhp(annualizedGross) + ') exceed ₱3,000,000. Switch Tax Regime to 12% VAT and ensure all component suppliers issue VAT invoices.';
        }
      }

      var staffAlert = document.getElementById('fin-staff-alert');
      if (staffAlert) {
        staffAlert.classList.toggle('d-none', !needsSecondTech);
        if (needsSecondTech) {
          staffAlert.textContent = 'Extra Staff Needed: More than ' + PROPOSAL_CATALOG.singleTechMaxBuilds + ' builds/mo or ' + PROPOSAL_CATALOG.singleTechMaxSeats + ' support PCs adds +₱28,000/mo for a second technician.';
        }
      }

      var schedule = [];
      var cumulative = -PROPOSAL_CATALOG.capexTotalPhp;
      var tbody = document.getElementById('cashflow-tbody');
      if (tbody) {
        while (tbody.firstChild) {
          tbody.removeChild(tbody.firstChild);
        }
      }

      for (var m = 1; m <= 12; m += 1) {
        var ramp = m === 1 ? 0.60 : (m === 2 ? 0.80 : (m === 3 ? 0.92 : 1.0));
        var mGross = Math.round(totalMonthlyGross * ramp);
        var mContribution = Math.round(totalMonthlyContribution * ramp);
        var mTax = Math.round(monthlyTaxPhp * ramp);
        var mNet = mContribution - effectiveFixedOpex - mTax;
        cumulative += mNet;

        var rowObj = {
          month: m,
          grossPhp: mGross,
          contributionPhp: mContribution,
          opexPhp: effectiveFixedOpex + mTax,
          netPhp: mNet,
          cumulativePhp: cumulative
        };
        schedule.push(rowObj);

        if (tbody) {
          var tr = document.createElement('tr');
          var cells = [
            'Month ' + m,
            formatPhp(rowObj.grossPhp),
            formatPhp(rowObj.contributionPhp),
            formatPhp(rowObj.opexPhp),
            formatPhp(rowObj.netPhp),
            formatPhp(rowObj.cumulativePhp)
          ];
          cells.forEach(function (val, idx) {
            var td = document.createElement('td');
            td.textContent = val;
            if (idx > 0) {
              td.className = 'num-php text-end';
            }
            if (idx === 5) {
              td.className += rowObj.cumulativePhp >= 0 ? ' fw-bold text-success' : ' fw-bold';
            }
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        }
      }

      renderCashFlowChart(schedule);
    }

    [buildsSlider, retainersSlider, marginSlider, rmaSlider, taxSelect].forEach(function (el) {
      if (el) { el.addEventListener('input', recalcFinancials); }
      if (el && el.tagName === 'SELECT') { el.addEventListener('change', recalcFinancials); }
    });

    if (importBenchmarkBtn) {
      importBenchmarkBtn.addEventListener('click', function () {
        useImportedBenchmark = !useImportedBenchmark;
        importBenchmarkBtn.textContent = useImportedBenchmark
          ? 'Using Saved Build (Reset to Average)'
          : 'Use My Saved Build Price';
        recalcFinancials();
      });
    }

    if (resetBaselineBtn) {
      resetBaselineBtn.addEventListener('click', function () {
        useImportedBenchmark = false;
        if (buildsSlider) { buildsSlider.value = '9'; }
        if (retainersSlider) { retainersSlider.value = '5'; }
        if (marginSlider) { marginSlider.value = '17'; }
        if (rmaSlider) { rmaSlider.value = '3'; }
        if (taxSelect) { taxSelect.value = 'nonvat-8'; }
        if (importBenchmarkBtn) {
          importBenchmarkBtn.textContent = 'Use My Saved Build Price';
        }
        recalcFinancials();
      });
    }

    recalcFinancials();
  }

  function populatePaymentPlanSelect(selectEl) {
    if (!selectEl) {
      return;
    }
    while (selectEl.firstChild) {
      selectEl.removeChild(selectEl.firstChild);
    }
    Object.keys(PROPOSAL_CATALOG.paymentPlans).forEach(function (planId) {
      var plan = PROPOSAL_CATALOG.paymentPlans[planId];
      var opt = document.createElement('option');
      opt.value = plan.id;
      opt.textContent = plan.name;
      selectEl.appendChild(opt);
    });
  }

  function validatePhPhoneInput(phoneInput) {
    if (!phoneInput) {
      return true;
    }
    var cleaned = phoneInput.value.replace(/[\s-]/g, '');
    var phValid = /^(09|\+639)\d{9}$/.test(cleaned);
    phoneInput.setCustomValidity(phValid ? '' : 'Enter a valid PH mobile number (09XXXXXXXXX or +639XXXXXXXXX).');
    return phValid;
  }

  function wireCopyTextButton(btnEl, preId, feedbackEl, successMsg) {
    if (!btnEl) {
      return;
    }
    btnEl.addEventListener('click', function () {
      var pre = document.getElementById(preId);
      if (!pre) { return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pre.textContent).then(function () {
          if (feedbackEl) {
            feedbackEl.textContent = successMsg || 'Copied text to clipboard.';
          }
        }).catch(function () {
          if (feedbackEl) {
            feedbackEl.textContent = 'Clipboard blocked — select text above or use Print / Save PDF.';
          }
        });
      }
    });
  }

  function wirePrintButton(btnEl) {
    if (btnEl) {
      btnEl.addEventListener('click', function () {
        globalScope.print();
      });
    }
  }

  function initContactProposalForm() {
    var form = document.getElementById('proposal-contact-form');
    if (!form) {
      return;
    }

    var detachBtn = document.getElementById('contact-detach-quote');
    var copyBtn = document.getElementById('copy-dossier-btn');
    var printBtn = document.getElementById('print-dossier-btn');
    var mailtoLink = document.getElementById('mailto-dossier-link');
    var slipPanel = document.getElementById('dossier-confirmation-slip');
    var copyFeedback = document.getElementById('copy-feedback');
    var buyerSelect = document.getElementById('contact-buyer-type');
    var payPlanSelect = document.getElementById('contact-payment-plan');
    var orgInput = document.getElementById('contact-org');

    function updateOrgFieldForBuyer(buyerType) {
      if (!orgInput) {
        return;
      }
      orgInput.placeholder = buyerType === 'b2b'
        ? 'e.g., Diliman Spatial Lab (Company / Clinic)'
        : 'Optional — leave blank for personal / student order';
    }

    function renderAttachedQuote() {
      var s = ProposalStore.get();
      var q = s.activeQuote;
      var t = s.totals;
      var pay = t.payment || computeCustomerPaymentPlan(t.hardwareTotalPhp, q.paymentPlan);
      var downPct = Math.round(pay.plan.upFrontRatio * 100);
      var attachedCard = document.getElementById('attached-quote-panel');
      var detachedNotice = document.getElementById('detached-quote-notice');

      if (buyerSelect) {
        buyerSelect.value = t.buyerType;
      }
      if (payPlanSelect) {
        payPlanSelect.value = pay.plan.id;
      }
      updateOrgFieldForBuyer(t.buyerType);

      if (q.detachedFromContact) {
        if (attachedCard) { attachedCard.classList.add('d-none'); }
        if (detachedNotice) { detachedNotice.classList.remove('d-none'); }
      } else {
        if (attachedCard) { attachedCard.classList.remove('d-none'); }
        if (detachedNotice) { detachedNotice.classList.add('d-none'); }
      }

      setText(
        'contact-quote-provenance',
        (t.buyerType === 'b2b' ? 'B2B Business Quote · ' : 'B2C Personal Quote · ') + ProposalStore.getProvenanceLabel(s)
      );
      setText('contact-quote-tier', t.displayTitle + ' x ' + t.qty);
      renderPartsListElement('contact-quote-parts', t);
      setText('contact-quote-hardware', formatPhp(t.hardwareTotalPhp));
      setText('contact-quote-payplan', pay.plan.shortName);
      setText('contact-quote-deposit-label', 'Due Today (' + String(downPct) + '%)');
      setText('contact-quote-deposit', formatPhp(pay.downPaymentPhp));
      setText(
        'contact-quote-sla',
        t.monthlySlaPhp > 0 ? t.sla.name + ' (' + formatPhp(t.monthlySlaPhp) + '/mo)' : 'Free 1-Yr Warranty (₱0/mo)'
      );
      var contactCheckoutLink = document.getElementById('contact-to-checkout');
      if (contactCheckoutLink) {
        contactCheckoutLink.setAttribute('href', ProposalStore.buildQueryHref('/checkout', s));
      }
    }

    populatePaymentPlanSelect(payPlanSelect);

    if (buyerSelect) {
      buyerSelect.addEventListener('change', function () {
        var nextBuyer = buyerSelect.value === 'b2b' ? 'b2b' : 'b2c';
        var cur = ProposalStore.get().activeQuote;
        var patch = { buyerType: nextBuyer };
        if (nextBuyer === 'b2b' && cur.paymentPlan === 'split-70-30') {
          patch.paymentPlan = 'b2b-po';
        }
        if (nextBuyer === 'b2c' && cur.paymentPlan === 'b2b-po') {
          patch.paymentPlan = 'split-70-30';
        }
        ProposalStore.save(patch);
        renderAttachedQuote();
      });
    }

    if (payPlanSelect) {
      payPlanSelect.addEventListener('change', function () {
        if (PROPOSAL_CATALOG.paymentPlans[payPlanSelect.value]) {
          ProposalStore.save({ paymentPlan: payPlanSelect.value });
          renderAttachedQuote();
        }
      });
    }

    if (detachBtn) {
      detachBtn.addEventListener('click', function () {
        var current = ProposalStore.get();
        ProposalStore.save({ detachedFromContact: !current.activeQuote.detachedFromContact });
        renderAttachedQuote();
      });
    }

    var reattachBtn = document.getElementById('contact-reattach-quote');
    if (reattachBtn) {
      reattachBtn.addEventListener('click', function () {
        ProposalStore.save({ detachedFromContact: false });
        renderAttachedQuote();
      });
    }

    function buildPlainSummaryText(nameVal, orgVal, emailVal, phoneVal, notesVal, refId) {
      var s = ProposalStore.get();
      var t = s.totals;
      var pay = t.payment || computeCustomerPaymentPlan(t.hardwareTotalPhp, s.activeQuote.paymentPlan);
      var downPct = Math.round(pay.plan.upFrontRatio * 100);
      var buyerLabel = t.buyerType === 'b2b' ? 'Office / Business / Studio (B2B)' : 'Personal / Student / Individual (B2C)';
      var lines = [
        'NVIDIUM — FORMAL QUOTATION & SUPPORT REQUEST',
        'Recipient: Uzel Hector M. Escobido, Principal Proprietor (uEscobido@l-ala.studio)',
        'Reference ID: ' + refId,
        'Order Type: ' + buyerLabel,
        'Name: ' + nameVal,
        'School / Studio / Office: ' + (orgVal || 'Individual / Personal'),
        'Email: ' + emailVal,
        'Mobile: ' + phoneVal,
        '---'
      ];
      if (s.activeQuote.detachedFromContact) {
        lines.push('Attached Quote: General Inquiry (No PC Build Attached)');
      } else {
        lines.push('Selected Build: ' + t.displayTitle + ' x ' + t.qty);
        lines.push('Parts List (per PC):');
        t.partsBreakdown.forEach(function (part) {
          lines.push('  - ' + part.label + ': ' + part.name + ' (' + formatPhp(part.pricePhp) + ')');
        });
        lines.push('  - Build & 24-Hour Stress Test Fee: ' + formatPhp(t.assemblyFeePhp));
        if (t.addons.length > 0) {
          lines.push('Extras Added (per PC):');
          t.addons.forEach(function (addonId) {
            var ad = PROPOSAL_CATALOG.addons[addonId];
            if (ad) {
              lines.push('  - ' + ad.name + ' (' + formatPhp(ad.pricePhp) + ')');
            }
          });
        }
        lines.push('Total PC & Parts Price: ' + formatPhp(t.hardwareTotalPhp));
        lines.push('Payment Plan: ' + pay.plan.name);
        if (pay.installmentFeePhp > 0) {
          lines.push('Total With Installment Fee: ' + formatPhp(pay.totalPayablePhp));
        }
        lines.push('Down Payment Due Today (' + downPct + '%): ' + formatPhp(pay.downPaymentPhp));
        if (pay.months > 0) {
          lines.push('Monthly Installment: ' + String(pay.months) + ' mos × ' + formatPhp(pay.monthlyInstallmentPhp) + '/mo');
        } else {
          lines.push('Remaining Balance Due on Pickup / Delivery: ' + formatPhp(pay.pickupBalancePhp));
        }
        lines.push('Monthly Support Plan: ' + (t.monthlySlaPhp > 0 ? t.sla.name + ' — ' + formatPhp(t.monthlySlaPhp) + '/mo' : 'Free 1-Year Shop Warranty (₱0/mo)'));
      }
      lines.push('Notes: ' + (notesVal || 'None'));
      lines.push('Status: Indicative Quote Summary (Generated Locally — Subject to Part Stock Confirmation)');
      return lines.join('\n');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();

      validatePhPhoneInput(document.getElementById('contact-phone'));

      form.classList.add('was-validated');
      if (!form.checkValidity()) {
        return;
      }

      var nameVal = document.getElementById('contact-name').value.trim();
      var orgVal = document.getElementById('contact-org').value.trim();
      var emailVal = document.getElementById('contact-email').value.trim();
      var phoneVal = document.getElementById('contact-phone').value.trim();
      var notesVal = document.getElementById('contact-notes').value.trim();
      var refId = 'NV-2026-' + String(Math.floor(1000 + (Date.now() % 9000)));

      var summaryText = buildPlainSummaryText(nameVal, orgVal, emailVal, phoneVal, notesVal, refId);
      setText('slip-ref-id', refId);
      setText('slip-client-line', nameVal + (orgVal ? ' — ' + orgVal : ''));
      setText('slip-contact-line', emailVal + ' · ' + phoneVal);
      setText('slip-summary-pre', summaryText);

      if (mailtoLink) {
        mailtoLink.setAttribute(
          'href',
          'mailto:uEscobido@l-ala.studio?subject=' +
            encodeURIComponent('Nvidium Formal Quotation Inquiry ' + refId) +
            '&body=' +
            encodeURIComponent(summaryText)
        );
      }

      if (slipPanel) {
        slipPanel.classList.remove('d-none');
        slipPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    wireCopyTextButton(copyBtn, 'slip-summary-pre', copyFeedback, 'Copied dossier summary to clipboard.');
    wirePrintButton(printBtn);

    renderAttachedQuote();
  }

  function initCheckoutPage() {
    var root = document.getElementById('checkout-app');
    if (!root) {
      return;
    }

    var ORDER_STORAGE_KEY = 'nvidium_last_order_v1';
    var pageTitleEl = document.getElementById('chk-page-title');
    var summaryPanel = document.getElementById('checkout-summary-panel');
    var buyerButtons = root.querySelectorAll('[data-chk-buyer]');
    var payPlanSelect = document.getElementById('chk-payment-plan');
    var fulfillmentSelect = document.getElementById('chk-fulfillment');
    var payFullCheck = document.getElementById('chk-pay-full');
    var orgInput = document.getElementById('chk-org');
    var form = document.getElementById('checkout-order-form');
    var formPanel = document.getElementById('checkout-form-panel');
    var successPanel = document.getElementById('checkout-success-panel');
    var fillDemoBtn = document.getElementById('chk-fill-demo-btn');
    var instantDemoBtn = document.getElementById('chk-instant-demo-btn');
    var replayAnimBtn = document.getElementById('ord-replay-anim-btn');
    var editOrderBtn = document.getElementById('ord-edit-btn');
    var printOrderBtn = document.getElementById('ord-print-btn');
    var copyOrderBtn = document.getElementById('ord-copy-btn');
    var copyFeedback = document.getElementById('ord-copy-feedback');
    var editPartsLink = document.getElementById('chk-edit-parts-link');
    var submitBtn = document.getElementById('chk-submit-btn');

    function getDeliveryInfo(mode) {
      if (mode === 'delivery-qc') {
        return {
          feePhp: 350,
          label: formatPhp(350) + ' (QC Courier)',
          etaText: '5 business days · QC Courier Delivery'
        };
      }
      if (mode === 'onsite-b2b') {
        return {
          feePhp: 0,
          label: '₱0 (Office Setup)',
          etaText: '5 business days · Office On-Site Setup'
        };
      }
      return {
        feePhp: 0,
        label: '₱0 (Workshop Pickup)',
        etaText: '5 business days · Workshop Pickup (Loyola Heights)'
      };
    }

    function computeCheckoutBreakdown(state) {
      var s = state || ProposalStore.get();
      var q = s.activeQuote;
      var t = s.totals;
      var pay = t.payment || computeCustomerPaymentPlan(t.hardwareTotalPhp, q.paymentPlan);
      var fulMode = fulfillmentSelect ? fulfillmentSelect.value : 'pickup';
      var deliv = getDeliveryInfo(fulMode);
      var payFull = Boolean(payFullCheck && payFullCheck.checked);
      var totalPayableWithDeliv = pay.totalPayablePhp + deliv.feePhp;
      var dueTodayPhp = payFull ? totalPayableWithDeliv : (pay.downPaymentPhp + deliv.feePhp);
      var downPct = Math.round(pay.plan.upFrontRatio * 100);

      var dueTodayLabel = '';
      var remainingLabel = '';
      var remainingDisplay = '';

      if (payFull) {
        dueTodayLabel = 'Paid (100%)';
        remainingLabel = 'Remaining';
        remainingDisplay = '₱0 (Paid in full)';
      } else if (pay.months > 0) {
        dueTodayLabel = 'Paid (' + String(downPct) + '% down)';
        remainingLabel = 'Monthly (' + String(pay.months) + ' mos)';
        remainingDisplay = formatPhp(pay.monthlyInstallmentPhp) + ' / mo (' + String(pay.months) + ' mos)';
      } else {
        dueTodayLabel = 'Paid (' + String(downPct) + '%)';
        remainingLabel = 'Due on Pickup (' + String(100 - downPct) + '%)';
        remainingDisplay = formatPhp(pay.pickupBalancePhp);
      }

      return {
        state: s,
        totals: t,
        pay: pay,
        deliv: deliv,
        payFull: payFull,
        totalPayableWithDeliv: totalPayableWithDeliv,
        dueTodayPhp: dueTodayPhp,
        dueTodayLabel: dueTodayLabel,
        remainingLabel: remainingLabel,
        remainingDisplay: remainingDisplay
      };
    }

    function renderCheckoutSummary(state) {
      var data = computeCheckoutBreakdown(state);
      var t = data.totals;
      var pay = data.pay;

      buyerButtons.forEach(function (btn) {
        var active = btn.getAttribute('data-chk-buyer') === t.buyerType;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      if (payPlanSelect) {
        payPlanSelect.value = pay.plan.id;
      }
      if (orgInput) {
        orgInput.placeholder = t.buyerType === 'b2b'
          ? 'e.g., Diliman Spatial Lab (Company / Clinic)'
          : 'Optional for personal orders';
      }

      setText(
        'chk-buyer-badge',
        t.buyerType === 'b2b' ? 'Business (B2B)' : 'Personal (B2C)'
      );
      setText('chk-build-title', t.displayTitle + ' x ' + t.qty);
      setText('chk-build-specs', t.specsSummary);
      renderPartsListElement('chk-parts-list', t);
      setText('chk-hardware-total', formatPhp(t.hardwareTotalPhp));
      setText(
        'chk-installment-fee',
        pay.installmentFeePhp > 0 ? '+' + formatPhp(pay.installmentFeePhp) : '₱0 (0% Fee)'
      );
      setText('chk-delivery-fee', data.deliv.label);
      setText('chk-total-payable', formatPhp(data.totalPayableWithDeliv));
      setText('chk-due-today-label', data.dueTodayLabel);
      setText('chk-due-today', formatPhp(data.dueTodayPhp));
      setText('chk-remaining-label', data.remainingLabel);
      setText('chk-remaining-amount', data.remainingDisplay);
      setText(
        'chk-sla-monthly',
        t.monthlySlaPhp > 0 ? formatPhp(t.monthlySlaPhp) + ' / mo (' + t.sla.name + ')' : '₱0 / mo (Free Warranty)'
      );

      if (submitBtn) {
        submitBtn.textContent = 'Complete Order · ' + formatPhp(data.dueTodayPhp);
      }
      if (editPartsLink) {
        editPartsLink.setAttribute('href', ProposalStore.buildQueryHref('/services', data.state));
      }
    }

    function buildCheckoutReceiptText(payload) {
      var t = payload.breakdown.totals;
      var pay = payload.breakdown.pay;
      var buyerLabel = t.buyerType === 'b2b' ? 'Business / Office (B2B)' : 'Personal / Student (B2C)';
      var lines = [
        'NVIDIUM — ORDER CONFIRMATION RECEIPT',
        'Order Reference: ' + payload.orderRef,
        'Order Date: ' + payload.timestampIso,
        'Buyer Type: ' + buyerLabel,
        'Customer Name: ' + payload.nameVal,
        'School / Company: ' + (payload.orgVal || 'Personal'),
        'Email: ' + payload.emailVal,
        'Mobile: ' + payload.phoneVal,
        'Pickup / Address: ' + (payload.addressVal || payload.breakdown.deliv.etaText),
        '---',
        'Build & Quantity: ' + t.displayTitle + ' x ' + t.qty,
        'Parts & Build Fee:'
      ];
      t.partsBreakdown.forEach(function (part) {
        lines.push('  - ' + part.label + ': ' + part.name + ' (' + formatPhp(part.pricePhp) + ')');
      });
      lines.push('  - Build & Stress Test Fee: ' + formatPhp(t.assemblyFeePhp));
      if (t.addons.length > 0) {
        lines.push('Extras Added (per PC):');
        t.addons.forEach(function (addonId) {
          var ad = PROPOSAL_CATALOG.addons[addonId];
          if (ad) {
            lines.push('  - ' + ad.name + ' (' + formatPhp(ad.pricePhp) + ')');
          }
        });
      }
      lines.push('---');
      lines.push('Parts Price: ' + formatPhp(t.hardwareTotalPhp));
      if (pay.installmentFeePhp > 0) {
        lines.push('Installment Fee: +' + formatPhp(pay.installmentFeePhp));
      }
      lines.push('Delivery / Pickup: ' + payload.breakdown.deliv.label);
      lines.push('Total Order: ' + formatPhp(payload.breakdown.totalPayableWithDeliv));
      lines.push('Payment Plan: ' + (payload.breakdown.payFull ? 'Paid 100% Upfront' : pay.plan.name));
      lines.push('Payment Status: ' + payload.paymentStatusLabel);
      lines.push('Paid Today: ' + formatPhp(payload.breakdown.dueTodayPhp));
      lines.push('Remaining / Monthly: ' + payload.breakdown.remainingDisplay);
      lines.push('Support Plan: ' + (t.monthlySlaPhp > 0 ? t.sla.name + ' (' + formatPhp(t.monthlySlaPhp) + '/mo)' : 'Free 1-Yr Warranty (₱0/mo)'));
      lines.push('Status: PAID & CONFIRMED · Test Bench Slot Assigned');
      return lines.join('\n');
    }

    populatePaymentPlanSelect(payPlanSelect);
    var initialState = ProposalStore.get();
    renderCheckoutSummary(initialState);

    buyerButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var nextBuyer = btn.getAttribute('data-chk-buyer') === 'b2b' ? 'b2b' : 'b2c';
        var cur = ProposalStore.get().activeQuote;
        var patch = { buyerType: nextBuyer };
        if (nextBuyer === 'b2b' && cur.paymentPlan === 'split-70-30') {
          patch.paymentPlan = 'b2b-po';
        }
        if (nextBuyer === 'b2c' && cur.paymentPlan === 'b2b-po') {
          patch.paymentPlan = 'split-70-30';
        }
        renderCheckoutSummary(ProposalStore.save(patch));
      });
    });

    if (payPlanSelect) {
      payPlanSelect.addEventListener('change', function () {
        if (PROPOSAL_CATALOG.paymentPlans[payPlanSelect.value]) {
          renderCheckoutSummary(ProposalStore.save({ paymentPlan: payPlanSelect.value }));
        }
      });
    }

    if (fulfillmentSelect) {
      fulfillmentSelect.addEventListener('change', function () {
        renderCheckoutSummary(ProposalStore.get());
      });
    }

    if (payFullCheck) {
      payFullCheck.addEventListener('change', function () {
        renderCheckoutSummary(ProposalStore.get());
      });
    }

    function fillDemoBuyerFields() {
      var isB2B = ProposalStore.get().activeQuote.buyerType === 'b2b';
      var nameEl = document.getElementById('chk-name');
      var orgEl = document.getElementById('chk-org');
      var emailEl = document.getElementById('chk-email');
      var phoneEl = document.getElementById('chk-phone');
      var addrEl = document.getElementById('chk-address');

      if (nameEl) { nameEl.value = 'Mateo Santos'; }
      if (orgEl) { orgEl.value = isB2B ? 'Diliman Spatial Lab' : 'UP Diliman Architecture'; }
      if (emailEl) { emailEl.value = 'mateo.santos@up.edu.ph'; }
      if (phoneEl) { phoneEl.value = '09175550184'; }
      if (addrEl) { addrEl.value = 'UP Diliman / Katipunan Ave, Quezon City'; }
    }

    var CHECKOUT_TIMING = {
      verifyHoldMs: 420,
      swapMs: 160
    };
    var verifyTimerId = null;
    var swapTimerId = null;

    function clearCheckoutTimers() {
      if (verifyTimerId !== null) {
        clearTimeout(verifyTimerId);
        verifyTimerId = null;
      }
      if (swapTimerId !== null) {
        clearTimeout(swapTimerId);
        swapTimerId = null;
      }
    }

    function setSubmitVerifyingState(isVerifying) {
      if (!submitBtn) {
        return;
      }
      if (isVerifying) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-verifying');
        while (submitBtn.firstChild) {
          submitBtn.removeChild(submitBtn.firstChild);
        }
        if (typeof document.createElementNS === 'function') {
          var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('class', 'esd-btn-spinner');
          svg.setAttribute('width', '16');
          svg.setAttribute('height', '16');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('fill', 'none');
          svg.setAttribute('aria-hidden', 'true');
          var arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          arc.setAttribute('d', 'M12 3a9 9 0 1 0 9 9');
          arc.setAttribute('stroke', 'currentColor');
          arc.setAttribute('stroke-width', '2.5');
          arc.setAttribute('stroke-linecap', 'round');
          svg.appendChild(arc);
          submitBtn.appendChild(svg);
        }
        submitBtn.appendChild(document.createTextNode('Confirming order…'));
      } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-verifying');
        renderCheckoutSummary(ProposalStore.get());
      }
    }

    var dotLottieBound = false;
    var pendingDotLottiePlay = false;

    function isReducedMotionPreferred() {
      return Boolean(
        globalScope.matchMedia &&
        globalScope.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    }

    function playDotLottieInstance(dl) {
      var sealWrap = document.getElementById('ord-animated-seal');
      if (!dl || !dl.isLoaded) {
        return false;
      }
      if (sealWrap && sealWrap.classList) {
        sealWrap.classList.add('is-lottie-ready');
      }
      if (typeof dl.resize === 'function') {
        dl.resize();
      }
      if (isReducedMotionPreferred()) {
        if (typeof dl.stop === 'function') {
          dl.stop();
        }
        if (typeof dl.setFrame === 'function') {
          var endFrame = Math.max(0, (dl.totalFrames || 120) - 1);
          dl.setFrame(endFrame);
        }
      } else {
        if (typeof dl.stop === 'function') {
          dl.stop();
        }
        if (typeof dl.setFrame === 'function') {
          dl.setFrame(0);
        }
        if (typeof dl.play === 'function') {
          dl.play();
        }
      }
      pendingDotLottiePlay = false;
      return true;
    }

    function bindDotLottieReady() {
      var player = document.getElementById('ord-dotlottie-player');
      if (!player) {
        return;
      }
      function attachInstance() {
        var dl = player.dotLottie;
        if (!dl) {
          return;
        }
        if (!dotLottieBound) {
          dotLottieBound = true;
          if (typeof dl.addEventListener === 'function') {
            dl.addEventListener('load', function () {
              if (pendingDotLottiePlay) {
                playDotLottieInstance(dl);
              } else {
                var sealWrap = document.getElementById('ord-animated-seal');
                if (sealWrap && sealWrap.classList) {
                  sealWrap.classList.add('is-lottie-ready');
                }
              }
            });
          }
        }
        if (dl.isLoaded && pendingDotLottiePlay) {
          playDotLottieInstance(dl);
        }
      }

      if (player.dotLottie) {
        attachInstance();
      } else if (globalScope.customElements && typeof globalScope.customElements.whenDefined === 'function') {
        globalScope.customElements.whenDefined('dotlottie-wc').then(attachInstance);
      }
    }

    bindDotLottieReady();

    function replaySuccessAnimation() {
      if (!successPanel || !successPanel.classList) {
        return;
      }
      successPanel.classList.remove('is-animating-success');
      if (typeof successPanel.offsetWidth === 'number') {
        void successPanel.offsetWidth;
      }
      successPanel.classList.add('is-animating-success');

      pendingDotLottiePlay = true;
      var player = document.getElementById('ord-dotlottie-player');
      if (player && player.dotLottie && player.dotLottie.isLoaded) {
        playDotLottieInstance(player.dotLottie);
      } else {
        bindDotLottieReady();
      }
    }

    function submitCheckoutOrder(options) {
      var immediate = Boolean(options && options.immediate);
      if (!form) {
        return;
      }

      validatePhPhoneInput(document.getElementById('chk-phone'));
      form.classList.add('was-validated');
      if (!form.checkValidity()) {
        return;
      }

      var nameVal = document.getElementById('chk-name').value.trim();
      var orgVal = document.getElementById('chk-org').value.trim();
      var emailVal = document.getElementById('chk-email').value.trim();
      var phoneVal = document.getElementById('chk-phone').value.trim();
      var addressVal = document.getElementById('chk-address').value.trim();

      var breakdown = computeCheckoutBreakdown(ProposalStore.get());
      var now = Date.now();
      var orderRef = 'NV-ORD-2026-' + String(Math.floor(1000 + (now % 9000)));
      var paymentStatusLabel = breakdown.payFull
        ? 'Paid in Full'
        : 'Paid — ' + breakdown.pay.plan.shortName;
      var timestampIso = new Date().toISOString();

      var receiptText = buildCheckoutReceiptText({
        orderRef: orderRef,
        timestampIso: timestampIso,
        nameVal: nameVal,
        orgVal: orgVal,
        emailVal: emailVal,
        phoneVal: phoneVal,
        addressVal: addressVal,
        paymentStatusLabel: paymentStatusLabel,
        breakdown: breakdown
      });

      function finalizeOrderReveal() {
        setText('ord-ref-id', orderRef);
        setText('ord-payment-status', paymentStatusLabel);
        setText('ord-paid-today', formatPhp(breakdown.dueTodayPhp));
        setText('ord-remaining-summary', breakdown.remainingDisplay);
        setText('ord-fulfillment-summary', breakdown.deliv.etaText);
        setText('ord-receipt-pre', receiptText);

        try {
          globalScope.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify({
            orderRef: orderRef,
            timestampIso: timestampIso,
            dueTodayPhp: breakdown.dueTodayPhp,
            paymentStatus: paymentStatusLabel,
            buyerName: nameVal
          }));
        } catch (_err) {
          storageRestricted = true;
        }

        if (!immediate && breakdown && breakdown.totals) {
          saveAccountPurchase({
            itemKind: 'confirmed_order',
            orderRef: orderRef,
            buildTitle: breakdown.totals.displayTitle,
            qty: breakdown.totals.qty,
            hardwareTotalPhp: breakdown.totalPayableWithDeliv,
            dueTodayPhp: breakdown.dueTodayPhp,
            paymentPlan: breakdown.payFull ? 'Paid 100%' : breakdown.pay.plan.shortName,
            slaLabel: breakdown.totals.monthlySlaPhp > 0 ? breakdown.totals.sla.name + ' (' + formatPhp(breakdown.totals.monthlySlaPhp) + '/mo)' : 'Free 1-Yr Warranty',
            statusLabel: paymentStatusLabel,
            quoteState: ProposalStore.get().activeQuote,
            receiptText: receiptText
          });
        }

        if (pageTitleEl) {
          pageTitleEl.classList.add('d-none');
        }
        if (summaryPanel) {
          summaryPanel.classList.add('d-none');
        }
        if (formPanel) {
          formPanel.classList.remove('is-exiting');
          formPanel.removeAttribute('aria-busy');
          formPanel.classList.add('d-none');
        }
        setSubmitVerifyingState(false);

        if (successPanel) {
          successPanel.classList.remove('d-none');
          replaySuccessAnimation();
          if (typeof successPanel.scrollIntoView === 'function') {
            successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }

      clearCheckoutTimers();

      if (immediate || typeof setTimeout !== 'function') {
        finalizeOrderReveal();
        return;
      }

      if (formPanel) {
        formPanel.setAttribute('aria-busy', 'true');
      }
      setSubmitVerifyingState(true);

      verifyTimerId = setTimeout(function () {
        verifyTimerId = null;
        if (formPanel) {
          formPanel.classList.add('is-exiting');
        }
        swapTimerId = setTimeout(function () {
          swapTimerId = null;
          finalizeOrderReveal();
        }, CHECKOUT_TIMING.swapMs);
      }, CHECKOUT_TIMING.verifyHoldMs);
    }

    if (fillDemoBtn) {
      fillDemoBtn.addEventListener('click', fillDemoBuyerFields);
    }

    if (instantDemoBtn) {
      instantDemoBtn.addEventListener('click', function () {
        fillDemoBuyerFields();
        submitCheckoutOrder({ immediate: false });
      });
    }

    if (replayAnimBtn) {
      replayAnimBtn.addEventListener('click', replaySuccessAnimation);
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();
        submitCheckoutOrder({ immediate: false });
      });
    }

    if (editOrderBtn) {
      editOrderBtn.addEventListener('click', function () {
        clearCheckoutTimers();
        setSubmitVerifyingState(false);
        pendingDotLottiePlay = false;
        var playerEl = document.getElementById('ord-dotlottie-player');
        if (playerEl && playerEl.dotLottie && typeof playerEl.dotLottie.stop === 'function') {
          playerEl.dotLottie.stop();
        }
        if (successPanel) {
          successPanel.classList.add('d-none');
          successPanel.classList.remove('is-animating-success');
        }
        if (pageTitleEl) {
          pageTitleEl.classList.remove('d-none');
        }
        if (summaryPanel) {
          summaryPanel.classList.remove('d-none');
        }
        if (formPanel) {
          formPanel.classList.remove('is-exiting');
          formPanel.removeAttribute('aria-busy');
          formPanel.classList.remove('d-none');
          triggerPanelSwap(formPanel);
        }
      });
    }

    wirePrintButton(printOrderBtn);
    wireCopyTextButton(copyOrderBtn, 'ord-receipt-pre', copyFeedback, 'Copied official receipt to clipboard.');

    try {
      var chkParams = new URLSearchParams(globalScope.location.search);
      if (chkParams.get('success') === '1') {
        fillDemoBuyerFields();
        submitCheckoutOrder({ immediate: true });
      }
    } catch (_err) {

    }
  }

  globalScope.addEventListener('error', function (evt) {
    var banner = document.getElementById('global-runtime-alert');
    if (banner && evt && evt.message) {
      banner.classList.remove('d-none');
      banner.textContent = 'Diagnostic Notice: Interactive component warning (' + evt.message + '). Static proposal content remains accessible.';
    }
  });

  var currentAccountUser = null;

  function fetchSessionUser() {
    if (typeof globalScope.fetch !== 'function') {
      return Promise.resolve(null);
    }
    return globalScope.fetch('/api/auth', { credentials: 'same-origin' })
      .then(function (r) {
        return r.ok ? r.json() : { authenticated: false, user: null };
      })
      .then(function (data) {
        currentAccountUser = data && data.authenticated ? data.user : null;
        return currentAccountUser;
      })
      .catch(function () {
        currentAccountUser = null;
        return null;
      });
  }

  function saveAccountPurchase(payload) {
    if (typeof globalScope.fetch !== 'function') {
      return Promise.resolve({ ok: false, status: 0, data: null });
    }
    return globalScope.fetch('/api/purchases', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          return { ok: r.ok, status: r.status, data: data };
        });
      })
      .catch(function () {
        return { ok: false, status: 0, data: { error: 'Network error' } };
      });
  }

  function syncAccountSessionUI(user) {
    var pill = document.getElementById('nav-account-pill');
    if (pill) {
      var labelSpan = pill.querySelector('span:last-child');
      if (user) {
        pill.classList.add('is-signed-in');
        var shortName = String(user.fullName || user.email || 'Account').split(' ')[0];
        if (labelSpan) {
          labelSpan.textContent = shortName + ' · 2FA';
        }
      } else {
        pill.classList.remove('is-signed-in');
        if (labelSpan) {
          labelSpan.textContent = 'Account · 2FA';
        }
      }
    }

    var chkStatus = document.getElementById('chk-account-status');
    var chkLink = document.getElementById('chk-account-link');
    var chkName = document.getElementById('chk-name');
    var chkEmail = document.getElementById('chk-email');
    if (chkStatus) {
      if (user) {
        chkStatus.textContent = 'Signed in as ' + user.fullName + ' (' + user.email + ') — Confirmed orders save to your vault.';
        if (chkLink) {
          chkLink.textContent = 'View Vault';
        }
        if (chkName && !chkName.value.trim()) {
          chkName.value = user.fullName || '';
        }
        if (chkEmail && !chkEmail.value.trim()) {
          chkEmail.value = user.email || '';
        }
      } else {
        chkStatus.textContent = 'Sign in with 2FA to save confirmed orders under your account.';
        if (chkLink) {
          chkLink.textContent = 'Sign In / Account';
        }
      }
    }
  }

  function initAccountPage() {
    var root = document.getElementById('account-app');
    if (!root) {
      return;
    }

    var authPanel = document.getElementById('account-auth-panel');
    var vaultPanel = document.getElementById('account-vault-panel');
    var modeButtons = root.querySelectorAll('[data-auth-mode]');
    var credForm = document.getElementById('auth-credentials-form');
    var totpForm = document.getElementById('auth-totp-form');
    var nameGroup = document.getElementById('auth-name-group');
    var fullNameInput = document.getElementById('auth-full-name');
    var emailInput = document.getElementById('auth-email');
    var passwordInput = document.getElementById('auth-password');
    var credSubmitBtn = document.getElementById('auth-credentials-submit');
    var enrollBox = document.getElementById('auth-enroll-box');
    var loginNote = document.getElementById('auth-login-2fa-note');
    var qrBox = document.getElementById('auth-qr-box');
    var secretEl = document.getElementById('auth-totp-secret');
    var copySecretBtn = document.getElementById('auth-copy-secret-btn');
    var totpCodeInput = document.getElementById('auth-totp-code');
    var totpBackBtn = document.getElementById('auth-totp-back');
    var errorAlert = document.getElementById('auth-error-alert');
    var logoutBtn = document.getElementById('vault-logout-btn');
    var refreshBtn = document.getElementById('vault-refresh-btn');
    var purchasesList = document.getElementById('vault-purchases-list');

    var authMode = 'login';
    var pendingChallenge = '';

    function showAuthError(msg) {
      if (!errorAlert) return;
      if (!msg) {
        errorAlert.classList.add('d-none');
        errorAlert.textContent = '';
      } else {
        errorAlert.textContent = msg;
        errorAlert.classList.remove('d-none');
      }
    }

    function setAuthMode(mode) {
      authMode = mode === 'signup' ? 'signup' : 'login';
      showAuthError('');
      modeButtons.forEach(function (btn) {
        var active = btn.getAttribute('data-auth-mode') === authMode;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (nameGroup) {
        nameGroup.classList.toggle('d-none', authMode !== 'signup');
      }
      if (fullNameInput) {
        fullNameInput.required = authMode === 'signup';
      }
      if (passwordInput) {
        passwordInput.setAttribute('autocomplete', authMode === 'signup' ? 'new-password' : 'current-password');
      }
      if (credSubmitBtn) {
        credSubmitBtn.textContent = authMode === 'signup' ? 'Create Account & Setup 2FA' : 'Continue to 2FA Verification';
      }
      if (credForm) credForm.classList.remove('d-none');
      if (totpForm) totpForm.classList.add('d-none');
    }

    function escapeHtmlText(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function renderPurchasesList(items) {
      if (!purchasesList) return;
      if (!items || items.length === 0) {
        purchasesList.innerHTML = '<div class="esd-well text-center small text-secondary py-4">No saved builds or confirmed orders yet. <a href="/services">Configure a PC build</a> or complete <a href="/checkout">checkout</a> while signed in.</div>';
        return;
      }
      purchasesList.innerHTML = items.map(function (item) {
        var stateHrefSuffix = '';
        try {
          var parsedQuote = JSON.parse(item.quote_state_json || '{}');
          if (parsedQuote && parsedQuote.tierId) {
            var q = new URLSearchParams();
            q.set('buyer', parsedQuote.buyerType || 'b2c');
            q.set('pay', parsedQuote.paymentPlan || 'split-70-30');
            q.set('tier', parsedQuote.tierId);
            q.set('qty', String(parsedQuote.qty || 1));
            q.set('sla', parsedQuote.slaId || 'none');
            if (parsedQuote.parts) {
              q.set('parts', encodePartsParam(parsedQuote.parts));
            }
            stateHrefSuffix = '?' + q.toString();
          }
        } catch (_e) {}

        var chipClass = item.item_kind === 'confirmed_order' ? 'status-chip status-chip-copper' : 'status-chip';
        var receiptHtml = item.receipt_text
          ? '<details class="esd-details mt-2"><summary class="font-mono-data small">View official receipt</summary><pre class="p-2 mt-2 border border-dark bg-light small font-mono-data mb-0" style="white-space: pre-wrap;">' + escapeHtmlText(item.receipt_text) + '</pre></details>'
          : '';
        return (
          '<article class="esd-well">' +
            '<div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">' +
              '<div>' +
                '<span class="' + chipClass + ' mb-1 d-inline-block">' + escapeHtmlText(item.status_label) + '</span>' +
                '<h3 class="h6 my-0">' + escapeHtmlText(item.build_title) + ' &times; ' + String(item.qty || 1) + '</h3>' +
                '<span class="font-mono-data small text-secondary">' + escapeHtmlText(item.order_ref) + ' · ' + escapeHtmlText(item.sla_label) + '</span>' +
              '</div>' +
              '<div class="text-end">' +
                '<strong class="num-php d-block">' + formatPhp(item.hardware_total_php || 0) + '</strong>' +
                '<span class="font-mono-data small text-secondary">Due today: ' + formatPhp(item.due_today_php || 0) + '</span>' +
              '</div>' +
            '</div>' +
            receiptHtml +
            '<div class="d-flex flex-wrap gap-2 mt-3">' +
              '<a href="/services' + stateHrefSuffix + '" class="btn btn-ink-outline btn-sm">Load in Builder</a>' +
              '<a href="/checkout' + stateHrefSuffix + '" class="btn btn-teal btn-sm">Checkout</a>' +
              '<button type="button" class="btn btn-ink-outline btn-sm ms-auto" data-delete-purchase="' + escapeHtmlText(item.id) + '">Remove</button>' +
            '</div>' +
          '</article>'
        );
      }).join('');

      purchasesList.querySelectorAll('[data-delete-purchase]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var targetId = btn.getAttribute('data-delete-purchase');
          btn.disabled = true;
          globalScope.fetch('/api/purchases?id=' + encodeURIComponent(targetId), {
            method: 'DELETE',
            credentials: 'same-origin'
          }).then(function () {
            loadPurchasesVault();
          });
        });
      });
    }

    function loadPurchasesVault() {
      if (!purchasesList || typeof globalScope.fetch !== 'function') return;
      purchasesList.innerHTML = '<div class="small font-mono-data text-secondary">Loading saved purchases...</div>';
      globalScope.fetch('/api/purchases', { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          renderPurchasesList(data.purchases || []);
        })
        .catch(function () {
          purchasesList.innerHTML = '<div class="small text-danger">Unable to load saved records.</div>';
        });
    }

    function enterVault(user) {
      currentAccountUser = user;
      syncAccountSessionUI(user);
      if (authPanel) authPanel.classList.add('d-none');
      if (vaultPanel) vaultPanel.classList.remove('d-none');
      setText('vault-user-name', user.fullName || 'Client');
      setText('vault-user-email', user.email || '');
      loadPurchasesVault();
    }

    function exitVault() {
      currentAccountUser = null;
      syncAccountSessionUI(null);
      if (vaultPanel) vaultPanel.classList.add('d-none');
      if (authPanel) authPanel.classList.remove('d-none');
      setAuthMode('login');
    }

    modeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setAuthMode(btn.getAttribute('data-auth-mode'));
      });
    });

    if (credForm) {
      credForm.addEventListener('submit', function (event) {
        event.preventDefault();
        showAuthError('');
        var payload = {
          action: authMode,
          email: emailInput ? emailInput.value.trim() : '',
          password: passwordInput ? passwordInput.value : ''
        };
        if (authMode === 'signup') {
          payload.fullName = fullNameInput ? fullNameInput.value.trim() : '';
        }
        if (credSubmitBtn) credSubmitBtn.disabled = true;
        globalScope.fetch('/api/auth', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
          .then(function (res) {
            if (credSubmitBtn) credSubmitBtn.disabled = false;
            if (!res.ok || !res.data.challengeToken) {
              showAuthError((res.data && res.data.error) || 'Authentication failed.');
              return;
            }
            pendingChallenge = res.data.challengeToken;
            credForm.classList.add('d-none');
            totpForm.classList.remove('d-none');
            if (res.data.isEnrollment) {
              if (enrollBox) enrollBox.classList.remove('d-none');
              if (loginNote) loginNote.classList.add('d-none');
              if (qrBox) qrBox.innerHTML = res.data.qrSvg || '';
              if (secretEl) secretEl.textContent = res.data.totpSecret || '';
            } else {
              if (enrollBox) enrollBox.classList.add('d-none');
              if (loginNote) loginNote.classList.remove('d-none');
            }
            if (totpCodeInput) {
              totpCodeInput.value = '';
              totpCodeInput.focus();
            }
          })
          .catch(function () {
            if (credSubmitBtn) credSubmitBtn.disabled = false;
            showAuthError('Network error contacting authentication service.');
          });
      });
    }

    if (copySecretBtn && secretEl) {
      copySecretBtn.addEventListener('click', function () {
        if (globalScope.navigator && globalScope.navigator.clipboard) {
          globalScope.navigator.clipboard.writeText(secretEl.textContent || '');
          copySecretBtn.textContent = 'Copied';
          setTimeout(function () { copySecretBtn.textContent = 'Copy Key'; }, 1500);
        }
      });
    }

    if (totpBackBtn) {
      totpBackBtn.addEventListener('click', function () {
        pendingChallenge = '';
        setAuthMode(authMode);
      });
    }

    if (totpForm) {
      totpForm.addEventListener('submit', function (event) {
        event.preventDefault();
        showAuthError('');
        var codeVal = totpCodeInput ? totpCodeInput.value.trim() : '';
        globalScope.fetch('/api/auth', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify_2fa',
            challengeToken: pendingChallenge,
            code: codeVal
          })
        })
          .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
          .then(function (res) {
            if (!res.ok || !res.data.authenticated) {
              showAuthError((res.data && res.data.error) || 'Invalid 2FA code.');
              return;
            }
            enterVault(res.data.user);
          })
          .catch(function () {
            showAuthError('Network error verifying 2FA code.');
          });
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        globalScope.fetch('/api/auth', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout' })
        }).then(exitVault);
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', loadPurchasesVault);
    }

    fetchSessionUser().then(function (u) {
      if (u) {
        enterVault(u);
      } else {
        setAuthMode('login');
      }
    });
  }

  function bootstrapApp() {
    initNavAndWayfinding();
    initServicesConfigurator();
    initMarketCalculator();
    initMarketingEstimator();
    initOperationsWorkflow();
    initFinancialSimulator();
    initContactProposalForm();
    initCheckoutPage();
    initAccountPage();
    fetchSessionUser().then(syncAccountSessionUI);
  }

  document.addEventListener('DOMContentLoaded', bootstrapApp);
  globalScope.addEventListener('pageshow', function (evt) {
    if (evt.persisted) {
      bootstrapApp();
    }
  });
  globalScope.addEventListener('storage', function (evt) {
    if (evt.key === STORAGE_KEY) {
      bootstrapApp();
    }
  });

  globalScope.PROPOSAL_CATALOG = PROPOSAL_CATALOG;
  globalScope.ProposalStore = ProposalStore;
  globalScope.isPartOptionCompatible = isPartOptionCompatible;
  globalScope.reconcilePartsCompatibility = reconcilePartsCompatibility;
  globalScope.initNavAndWayfinding = initNavAndWayfinding;
  globalScope.initServicesConfigurator = initServicesConfigurator;
  globalScope.initMarketCalculator = initMarketCalculator;
  globalScope.initMarketingEstimator = initMarketingEstimator;
  globalScope.initOperationsWorkflow = initOperationsWorkflow;
  globalScope.initFinancialSimulator = initFinancialSimulator;
  globalScope.initContactProposalForm = initContactProposalForm;
  globalScope.initCheckoutPage = initCheckoutPage;
})(window);
