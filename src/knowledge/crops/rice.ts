import type { CropModule } from '../types';

/**
 * Rice module: the most common diseases and pests in the Mekong Delta.
 * Immediate actions are deliberately non-chemical first steps; product and
 * dose decisions are left to the expert tier and the local extension officer.
 */
export const rice: CropModule = {
  id: 'rice',
  names: { vi: 'Lúa', en: 'Rice' },
  promptName: 'rice (Oryza sativa)',
  shots: [
    {
      id: 'close',
      label: { vi: 'Cận cảnh vết bệnh', en: 'Close-up of symptom' },
      hint: {
        vi: 'Chụp gần 20–30 cm, lá bệnh chiếm gần hết khung hình, đủ sáng.',
        en: 'Shoot from 20–30 cm so the affected leaf fills the frame, in good light.',
      },
    },
    {
      id: 'base',
      label: { vi: 'Gốc lúa / bẹ lá', en: 'Plant base / leaf sheath' },
      hint: {
        vi: 'Vạch tán lá, chụp gốc lúa sát mặt nước để thấy rầy, vết bệnh trên bẹ.',
        en: 'Part the canopy and shoot the base near the water line to show hoppers or sheath lesions.',
      },
    },
    {
      id: 'field',
      label: { vi: 'Toàn khóm / khoảnh ruộng', en: 'Whole clump / field patch' },
      hint: {
        vi: 'Lùi lại 1–2 m để thấy mức độ lan rộng trên ruộng.',
        en: 'Step back 1–2 m to show how far it has spread.',
      },
    },
  ],
  growthStages: [
    { id: 'seedling', label: { vi: 'Mạ / mới sạ (0–20 ngày)', en: 'Seedling (0–20 days)' } },
    { id: 'tillering', label: { vi: 'Đẻ nhánh (20–45 ngày)', en: 'Tillering (20–45 days)' } },
    { id: 'booting', label: { vi: 'Làm đòng (45–65 ngày)', en: 'Booting (45–65 days)' } },
    { id: 'heading', label: { vi: 'Trổ bông', en: 'Heading / flowering' } },
    { id: 'ripening', label: { vi: 'Chín', en: 'Ripening' } },
  ],
  conditions: [
    {
      id: 'rice_blast',
      kind: 'disease',
      names: { vi: 'Bệnh đạo ôn', en: 'Rice blast' },
      scientificName: 'Pyricularia oryzae',
      promptHint:
        'Diamond or spindle-shaped leaf lesions with a grey-white centre and brown border; can also rot the panicle neck.',
      profile: {
        organs: ['leaf', 'panicle_grain'],
        lesionColors: ['grey_white_center', 'brown'],
        lesionShapes: ['diamond_spindle'],
        patterns: ['scattered_spots'],
        signs: [],
      },
      severity: 'high',
      spreadsFast: true,
      reportToStation: true,
      immediateActions: {
        vi: [
          'Ngưng bón phân đạm và phân bón lá ngay.',
          'Giữ nước ruộng ổn định, không để ruộng khô.',
          'Báo cán bộ khuyến nông / BVTV xã để được hướng dẫn thuốc phù hợp.',
        ],
        en: [
          'Stop applying nitrogen and foliar fertiliser now.',
          'Keep the field flooded at a stable level; do not let it dry out.',
          'Notify the local extension or plant-protection officer for product advice.',
        ],
      },
      lookalikes: ['brown_spot'],
    },
    {
      id: 'bacterial_leaf_blight',
      kind: 'disease',
      names: { vi: 'Bệnh bạc lá (cháy bìa lá)', en: 'Bacterial leaf blight' },
      scientificName: 'Xanthomonas oryzae pv. oryzae',
      promptHint:
        'Yellow to straw-white stripes starting at the leaf tip or margins with a wavy edge, sometimes water-soaked.',
      profile: {
        organs: ['leaf'],
        lesionColors: ['yellow_orange', 'white_straw', 'water_soaked_green_grey'],
        lesionShapes: ['stripe_from_tip_or_margin'],
        patterns: ['from_leaf_tip_or_edge'],
        signs: [],
      },
      severity: 'high',
      spreadsFast: true,
      reportToStation: true,
      immediateActions: {
        vi: [
          'Ngưng bón đạm; ưu tiên bón kali cân đối.',
          'Không cho nước từ ruộng bệnh chảy tràn sang ruộng khác.',
          'Hạn chế đi lại trong ruộng khi lá còn ướt.',
        ],
        en: [
          'Stop nitrogen; favour balanced potassium.',
          'Do not let water drain from this field into neighbouring fields.',
          'Avoid walking through the crop while leaves are wet.',
        ],
      },
      lookalikes: ['stunt_virus'],
    },
    {
      id: 'sheath_blight',
      kind: 'disease',
      names: { vi: 'Bệnh khô vằn', en: 'Sheath blight' },
      scientificName: 'Rhizoctonia solani',
      promptHint:
        'Oval or irregular greenish-grey blotches with brown borders on the leaf sheath near the water line, like snake skin.',
      profile: {
        organs: ['leaf_sheath', 'stem'],
        lesionColors: ['water_soaked_green_grey', 'brown'],
        lesionShapes: ['irregular_blotch'],
        patterns: ['near_water_line_or_base'],
        signs: ['fungal_growth'],
      },
      severity: 'medium',
      spreadsFast: false,
      reportToStation: false,
      immediateActions: {
        vi: [
          'Giảm bón đạm, không sạ quá dày ở vụ sau.',
          'Rút cạn nước vài ngày nếu ruộng cho phép để giảm ẩm độ gốc.',
          'Theo dõi tỉ lệ bụi bệnh trước khi quyết định phun.',
        ],
        en: [
          'Reduce nitrogen; avoid dense sowing next season.',
          'Drain the field for a few days if possible to lower humidity at the base.',
          'Count affected hills before deciding to spray.',
        ],
      },
      lookalikes: ['rice_blast'],
    },
    {
      id: 'brown_spot',
      kind: 'disease',
      names: { vi: 'Bệnh đốm nâu', en: 'Brown spot' },
      scientificName: 'Bipolaris oryzae',
      promptHint:
        'Many small round or oval brown spots, sometimes with a grey centre, scattered over the leaf; often linked to poor soil.',
      profile: {
        organs: ['leaf', 'panicle_grain'],
        lesionColors: ['brown', 'dark_purple_black'],
        lesionShapes: ['small_round_oval'],
        patterns: ['scattered_spots'],
        signs: [],
      },
      severity: 'medium',
      spreadsFast: false,
      reportToStation: false,
      immediateActions: {
        vi: [
          'Bổ sung dinh dưỡng cân đối, chú ý kali và vôi nếu đất phèn.',
          'Kiểm tra nước ruộng có bị ngộ độc hữu cơ / phèn không.',
        ],
        en: [
          'Rebalance nutrition, especially potassium, and lime on acid sulphate soils.',
          'Check the field water for acidity or organic toxicity.',
        ],
      },
      lookalikes: ['rice_blast'],
    },
    {
      id: 'brown_planthopper',
      kind: 'pest',
      names: { vi: 'Rầy nâu', en: 'Brown planthopper' },
      scientificName: 'Nilaparvata lugens',
      promptHint:
        'Small brown hoppers clustered at the plant base; heavy attack causes circular yellow-brown dried patches (hopperburn).',
      profile: {
        organs: ['stem', 'leaf_sheath', 'whole_plant'],
        lesionColors: ['yellow_orange', 'brown'],
        lesionShapes: ['none'],
        patterns: ['near_water_line_or_base', 'circular_patches_in_field'],
        signs: ['insects'],
      },
      severity: 'high',
      spreadsFast: true,
      reportToStation: true,
      immediateActions: {
        vi: [
          'Vạch gốc lúa đếm mật độ rầy ở vài điểm trong ruộng.',
          'Không phun thuốc trừ sâu phổ rộng: dễ diệt thiên địch và làm rầy bộc phát.',
          'Báo trạm BVTV; rầy nâu còn truyền bệnh vàng lùn – lùn xoắn lá.',
        ],
        en: [
          'Part the plants and count hoppers at several spots in the field.',
          'Avoid broad-spectrum insecticides: they kill natural enemies and cause outbreaks.',
          'Notify the plant-protection station; hoppers also spread stunt viruses.',
        ],
      },
      lookalikes: ['stunt_virus'],
    },
    {
      id: 'rice_leaf_folder',
      kind: 'pest',
      names: { vi: 'Sâu cuốn lá nhỏ', en: 'Rice leaf folder' },
      scientificName: 'Cnaphalocrocis medinalis',
      promptHint:
        'Leaves folded lengthwise with white longitudinal streaks where the larva scraped the green tissue.',
      profile: {
        organs: ['leaf'],
        lesionColors: ['white_straw'],
        lesionShapes: ['folded_or_rolled_leaf', 'longitudinal_white_streaks'],
        patterns: ['scattered_spots'],
        signs: ['insects', 'webbing_or_frass'],
      },
      severity: 'medium',
      spreadsFast: false,
      reportToStation: false,
      immediateActions: {
        vi: [
          'Ở giai đoạn đẻ nhánh lúa tự bù được: chưa cần phun trong 40 ngày đầu.',
          'Theo dõi mật độ sâu; chỉ xử lý khi lá đòng bị hại nặng.',
        ],
        en: [
          'Rice compensates during tillering: no spraying needed in the first 40 days.',
          'Monitor larvae; act only if the flag leaf is heavily damaged.',
        ],
      },
      lookalikes: [],
    },
    {
      id: 'stunt_virus',
      kind: 'virus',
      names: { vi: 'Bệnh vàng lùn – lùn xoắn lá', en: 'Grassy / ragged stunt virus' },
      scientificName: 'RGSV / RRSV',
      promptHint:
        'Whole plants stunted with yellow-orange leaves (grassy stunt) or short, twisted, ragged leaves (ragged stunt).',
      profile: {
        organs: ['whole_plant', 'leaf'],
        lesionColors: ['yellow_orange'],
        lesionShapes: ['twisted_or_ragged_leaf', 'none'],
        patterns: ['whole_plant_discolored_or_stunted'],
        signs: ['insects'],
      },
      severity: 'high',
      spreadsFast: true,
      reportToStation: true,
      immediateActions: {
        vi: [
          'Nhổ bỏ và vùi sâu các bụi bệnh để giảm nguồn lây.',
          'Kiểm tra rầy nâu – môi giới truyền bệnh – ở gốc lúa.',
          'Báo ngay trạm BVTV: bệnh có thể lan rộng cả cánh đồng.',
        ],
        en: [
          'Pull out and bury infected hills to remove the source.',
          'Check for brown planthoppers, which spread the virus.',
          'Report to the plant-protection station immediately.',
        ],
      },
      lookalikes: ['bacterial_leaf_blight', 'brown_planthopper'],
    },
    {
      id: 'golden_apple_snail',
      kind: 'pest',
      names: { vi: 'Ốc bươu vàng', en: 'Golden apple snail' },
      scientificName: 'Pomacea canaliculata',
      promptHint:
        'Young plants cut at the base or missing, snails in the water, and bright pink egg masses on stems or stakes.',
      profile: {
        organs: ['stem', 'whole_plant'],
        lesionColors: ['none'],
        lesionShapes: ['cut_or_missing_tissue'],
        patterns: ['near_water_line_or_base', 'circular_patches_in_field'],
        signs: ['snails', 'egg_masses'],
      },
      severity: 'medium',
      spreadsFast: false,
      reportToStation: false,
      immediateActions: {
        vi: [
          'Thu gom ốc và ổ trứng hồng, đập bỏ hoặc vùi xuống bùn.',
          'Cắm cọc tre trong ruộng để dụ ốc đẻ trứng rồi thu gom.',
          'Rút nước, đào rãnh nhỏ để gom ốc về một chỗ.',
        ],
        en: [
          'Hand-pick snails and pink egg masses; crush or bury them.',
          'Place bamboo stakes to attract egg laying, then collect.',
          'Drain the field and dig small channels to gather snails.',
        ],
      },
      lookalikes: [],
    },
    {
      id: 'healthy',
      kind: 'healthy',
      names: { vi: 'Cây khỏe', en: 'Healthy' },
      promptHint: 'Uniform green leaves without lesions, insects or discoloration.',
      profile: {
        organs: ['leaf', 'whole_plant'],
        lesionColors: ['none'],
        lesionShapes: ['none'],
        patterns: ['uniform_healthy'],
        signs: [],
      },
      severity: 'low',
      spreadsFast: false,
      reportToStation: false,
      immediateActions: {
        vi: ['Tiếp tục thăm đồng định kỳ 5–7 ngày/lần.'],
        en: ['Keep scouting the field every 5–7 days.'],
      },
      lookalikes: [],
    },
  ],
};
