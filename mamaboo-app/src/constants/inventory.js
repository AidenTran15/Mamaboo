// Inventory Storage Keys
export const INVENTORY_STORAGE_KEY = 'inventoryRecords';
export const INVENTORY_ALERTS_KEY = 'inventoryAlerts';

// Cấu trúc dữ liệu nguyên vật liệu
export const INVENTORY_CATEGORIES = {
  packaging: {
    name: 'PACKAGING',
    items: [
      { id: 'tui-dung-ly-doi', name: 'Túi đựng ly đôi', unit: 'kg' },
      { id: 'tui-dung-ly-don', name: 'Túi đựng ly đơn', unit: 'kg' },
      { id: 'tui-dung-da', name: 'Túi đựng đá', unit: 'kg' },
      { id: 'giay-nen', name: 'Giấy nến', unit: 'bịch' },
      { id: 'ong-hut', name: 'Ống hút', unit: 'bịch' },
      { id: 'muong', name: 'Muỗng', unit: 'bịch' },
      { id: 'ly-500ml', name: 'Ly 500ml', unit: 'ống' },
      { id: 'ly-700ml', name: 'Ly 700ml', unit: 'ống' },
      { id: 'ly-1lit', name: 'Ly 1 lít', unit: 'ống' },
      { id: 'nap-phang-sm', name: 'Nắp phẳng S,M', unit: 'ống' },
      { id: 'nap-cau-sm', name: 'Nắp cầu S,M', unit: 'ống' },
      { id: 'nap-cau-l', name: 'Nắp cầu L', unit: 'cái' },
      { id: 'the-tich-diem', name: 'Thẻ tích điểm', unit: 'hộp' },
      { id: 'bang-keo-co-dinh-ly', name: 'Băng keo cố định ly', unit: 'cuộn' }
    ]
  },
  guestCheck: {
    name: 'GUEST CHECK',
    items: [
      { id: 'biscoff-ca-he', name: 'Biscoff Cà Hê', unit: 'tờ' },
      { id: 'banofee-latte', name: 'Banofee Latte', unit: 'tờ' },
      { id: 'tiramisu-ca-he', name: 'Tiramisu Cà Hệ', unit: 'tờ' },
      { id: 'salted-caramel-ca-he', name: 'Salted Caramel Cà Hê', unit: 'tờ' },
      { id: 'maple-latte', name: 'Maple Latte', unit: 'tờ' },
      { id: 'matcha-original', name: 'Matcha Original', unit: 'tờ' },
      { id: 'matcha-chuoi-pu-di', name: 'Matcha Chúi Pú Đi', unit: 'tờ' },
      { id: 'matcha-rim-bu-le', name: 'Matcha Rim Bù Lé', unit: 'tờ' },
      { id: 'matcha-phom-biec', name: 'Matcha Phom Biéc', unit: 'tờ' },
      { id: 'matcha-e-gey', name: 'Matcha Ê Gêy', unit: 'tờ' },
      { id: 'matcha-zau-te', name: 'Matcha Zâu Te', unit: 'tờ' },
      { id: 'matcha-trui', name: 'Matcha Trúi', unit: 'tờ' },
      { id: 'matcha-j97', name: 'Matcha J97', unit: 'tờ' },
      { id: 'matcha-canada', name: 'Matcha Canada', unit: 'tờ' },
      { id: 'matcha-thon', name: 'Matcha Thon', unit: 'tờ' },
      { id: 'houjicha-original', name: 'Houjicha Original', unit: 'tờ' },
      { id: 'houjicha-chuoi-pu-di', name: 'Houjicha Chúi Pú Đi', unit: 'tờ' },
      { id: 'houjicha-phom-biec', name: 'Houjicha Phom Biéc', unit: 'tờ' },
      { id: 'houjicha-rim-bu-le', name: 'Houjicha Rim Bù Lé', unit: 'tờ' },
      { id: 'houjicha-e-gey', name: 'Houjicha Ê Gêy', unit: 'tờ' },
      { id: 'houjicha-carameo', name: 'Houjicha Carameo', unit: 'tờ' },
      { id: 'houjicha-j97', name: 'Houjicha J97', unit: 'tờ' },
      { id: 'houjicha-canada', name: 'Houjicha Canada', unit: 'tờ' },
      { id: 'houjicha-thon', name: 'Houjicha Thon', unit: 'tờ' },
      { id: 'cacao-original', name: 'Cacao Original', unit: 'tờ' },
      { id: 'cacao-chuoi-pu-di', name: 'Cacao Chúi Pú Đi', unit: 'tờ' },
      { id: 'cacao-6-mui', name: 'Cacao 6 múi', unit: 'tờ' },
      { id: 'cacao-pmb', name: 'Cacao PMB', unit: 'tờ' },
      { id: 'cacao-caramel', name: 'Cacao Caramel', unit: 'tờ' },
      { id: 'cacao-rim-bu-le', name: 'Cacao Rim Bù Lé', unit: 'tờ' },
      { id: 'ori-makiato', name: 'Ori Makiato', unit: 'tờ' }
    ]
  },
  bot: {
    name: 'BỘT',
    items: [
      { id: 'matcha-thuong', name: 'Matcha Thường', unit: 'hủ' },
      { id: 'matcha-premium', name: 'Matcha Premium', unit: 'hủ' },
      { id: 'houjicha-thuong', name: 'Houjicha Thường', unit: 'hủ' },
      { id: 'houjicha-premium', name: 'Houjicha Premium', unit: 'hủ' },
      { id: 'cacao-bot', name: 'Cacao', unit: 'bịch' },
      { id: 'ca-phe', name: 'Cà phê', unit: 'bịch' }
    ]
  },
  sot: {
    name: 'SỐT (BÁO TÌNH TRẠNG)',
    items: [
      { id: 'maple-syrup', name: 'Maple Syrup', unit: 'chai' },
      { id: 'sot-dau', name: 'Sốt Dâu', unit: 'hủ' },
      { id: 'sot-caramel', name: 'Sốt Caramel', unit: 'chai' },
      { id: 'earl-grey', name: 'Earl Grey', unit: 'chai' },
      { id: 'sot-lotus', name: 'Sốt Lotus', unit: 'chai' },
      { id: 'hershey-scl', name: 'Hershey Scl', unit: 'chai' },
      { id: 'sot-chuoi', name: 'Sốt Chuối', unit: 'hủ' },
      { id: 'sot-tiramisu', name: 'Sốt Tiramisu', unit: 'chai' }
    ]
  },
  botFoam: {
    name: 'BỘT FOAM (BÁO TÌNH TRẠNG)',
    items: [
      { id: 'bot-kem-beo', name: 'Bột Kem béo', unit: 'hủ' },
      { id: 'bot-whipping-cream', name: 'Bột Whipping Cream', unit: 'hủ' },
      { id: 'bot-foam-pho-mai', name: 'Bột Foam Phô Mai', unit: 'hủ' },
      { id: 'bot-milk-foam', name: 'Bột Milk Foam', unit: 'hủ' },
      { id: 'bot-milk-foam-muoi', name: 'Bột Milk Foam Muối', unit: 'hủ' },
      { id: 'bot-hdb', name: 'Bột HĐB', unit: 'hủ' },
      { id: 'bot-pudding-trung', name: 'Bột Pudding Trứng', unit: 'hủ' },
      { id: 'bot-cream-brulee', name: 'Bột Cream Brulee', unit: 'hủ' }
    ]
  },
  topping: {
    name: 'TOPPING',
    items: [
      { id: 'dalgona', name: 'Dalgona', unit: 'bịch' },
      { id: 'tran-chau-dua', name: 'Trân Châu Dừa', unit: 'bịch' },
      { id: 'panna-cotta', name: 'Panna Cotta', unit: 'hủ' },
      { id: 'banana-pudding-combo', name: 'Banana Pudding combo (Báo tình trạng)', unit: 'hộp' }
    ]
  },
  bananaPudding: {
    name: 'Banana Pudding',
    items: [
      { id: 'banana-pudding-s', name: 'Banana Pudding size S', unit: 'hộp' },
      { id: 'banana-pudding-l', name: 'Banana Pudding size L', unit: 'hộp' }
    ]
  },
  sua: {
    name: 'SỮA',
    items: [
      { id: 'sua-do', name: 'Sữa đỏ', unit: 'hộp' },
      { id: 'sua-milklab-bo', name: 'Sữa Milklab Bò', unit: 'hộp' },
      { id: 'sua-milklab-oat', name: 'Sữa Milklab Oat', unit: 'hộp' },
      { id: 'boring-milk', name: 'Boring Milk', unit: 'hộp' },
      { id: 'sua-dac', name: 'Sữa đặc', unit: 'hộp' },
      { id: 'arla', name: 'Arla', unit: 'hộp' }
    ]
  },
  cookies: {
    name: 'COOKIES',
    items: [
      { id: 'redvelvet', name: 'Redvelvet', unit: 'cái' },
      { id: 'double-choco', name: 'Double choco', unit: 'cái' },
      { id: 'brownie', name: 'Brownie', unit: 'cái' },
      { id: 'tra-xanh-pho-mai', name: 'Trà xanh Phô Mai', unit: 'cái' },
      { id: 'salted-caramel-cookie', name: 'Salted Caramel', unit: 'cái' },
      { id: 'ba-tuoc-vo-cam-pho-mai', name: 'Bá tước vỏ cam Phô mai', unit: 'cái' }
    ]
  },
  veSinh: {
    name: 'VỆ SINH (BÁO TÌNH TRẠNG)',
    items: [
      { id: 'xa-bong-rua-tay', name: 'Xà bông rửa tay', unit: 'chai' },
      { id: 'con-rua-tay', name: 'Cồn rửa tay', unit: 'chai' },
      { id: 'nuoc-rua-chen', name: 'Nước rửa chén', unit: 'chai' },
      { id: 'nuoc-lau-san', name: 'Nước lau sàn', unit: 'chai' },
      { id: 'khan-giay', name: 'Khăn giấy (báo số lượng)', unit: 'bịch' },
      { id: 'binh-xit-phong', name: 'Bình xịt phòng', unit: 'chai' }
    ]
  },
  others: {
    name: 'OTHERS (BÁO TÌNH TRẠNG)',
    items: [
      { id: 'nuoc-duong', name: 'Nước đường', unit: 'bình' },
      { id: 'banh-lotus', name: 'Bánh Lotus', unit: 'gram' },
      { id: 'oreo', name: 'Oreo (báo số lượng)', unit: 'bịch' }
    ]
  }
};

