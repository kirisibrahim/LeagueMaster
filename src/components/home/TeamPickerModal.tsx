import { supabase } from '@/api/supabase';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (team: { id: string, name: string, logo_url: string }) => void;
}

export default function TeamPickerModal({ visible, onClose, onSelect }: Props) {
    const [search, setSearch] = useState('');
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const ITEM_PER_PAGE = 20;

    // Takımları veritabanından çekme
    const fetchTeams = async (query: string, pageNum: number = 0) => {
        if (loading) return;
        setLoading(true);

        try {
            const from = pageNum * ITEM_PER_PAGE;
            const to = from + ITEM_PER_PAGE - 1;

            let rpc = supabase
                .from('official_teams')
                .select('id, name, logo_url')
                .order('name', { ascending: true })
                .range(from, to);

            if (query) {
                rpc = rpc.ilike('name', `%${query}%`);
            }

            const { data, error } = await rpc;
            if (error) throw error;

            if (data) {
                // Eğer ilk sayfadaysak listeyi sıfırla, değilsek üstüne ekle
                setTeams(prev => pageNum === 0 ? data : [...prev, ...data]);
            }
        } catch (err) {
            console.error("Takım getirme hatası:", err);
        } finally {
            setLoading(false);
        }
    };

    // Kullanıcı yazdıkça aramayı tetikle
    useEffect(() => {
        if (visible) {
            setPage(0);
            fetchTeams(search, 0);
        }
    }, [search, visible]);

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <StyledView className="flex-1 bg-[#0b0e11]/95 pt-20">
                <StyledView className="flex-1 bg-[#1a1d23] rounded-t-[30px] p-4 border-t border-white/10">

                    {/* HEADER */}
                    <StyledView className="flex-row justify-between items-center mb-4">
                        <StyledText className="text-[#00ff85] text-xl font-black italic">TAKIMINI SEÇ</StyledText>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={32} color="#444" />
                        </TouchableOpacity>
                    </StyledView>

                    {/* ARAMA INPUTU */}
                    <StyledView className="bg-[#0b0e11] rounded-2xl flex-row items-center px-4 mb-4 border border-white/5">
                        <Ionicons name="search" size={20} color="#00ff85" />
                        <TextInput
                            placeholder="Takım ara... (Örn: Galatasaray)"
                            placeholderTextColor="#444"
                            className="text-white flex-1 py-4 ml-3"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </StyledView>

                    {/* LİSTE */}
                    {loading && teams.length === 0 ? (
                        <StyledView className="flex-1 justify-center items-center">
                            <ActivityIndicator color="#00ff85" size="large" />
                        </StyledView>
                    ) : (
                        <FlatList
                            data={teams}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}

                            // SONA GELDİĞİNDE TETİKLENEN FONKSİYON
                            onEndReached={() => {
                                if (!loading && teams.length >= 20) {
                                    const nextPage = page + 1;
                                    setPage(nextPage);
                                    fetchTeams(search, nextPage);
                                }
                            }}
                            onEndReachedThreshold={0.5} // Liste bitmeden yüklemeye başla

                            // YÜKLENİYOR İNDİKATÖRÜ
                            ListFooterComponent={() =>
                                loading ? (
                                    <StyledView className="py-4">
                                        <ActivityIndicator color="#00ff85" />
                                    </StyledView>
                                ) : <StyledView className="h-10" />
                            }

                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        onSelect(item);
                                        onClose();
                                    }}
                                    activeOpacity={0.7}
                                    className="flex-row items-center p-4 mb-2 bg-[#0b0e11] rounded-2xl border border-white/5"
                                >
                                    <StyledImage
                                        source={{ uri: item.logo_url }}
                                        className="w-10 h-10 mr-4"
                                        resizeMode="contain"
                                    />
                                    <StyledText className="text-white font-bold text-lg">{item.name}</StyledText>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </StyledView>
            </StyledView>
        </Modal>
    );
}