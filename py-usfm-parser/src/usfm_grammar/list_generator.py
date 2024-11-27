'''Logics for USJ to list(table) and Bible NLP format conversions'''


class ListGenerator:
    '''Combines the methods used for List generattion from USJ'''
    def __init__(self):
        '''Variables shared by functions'''
        self.book = ""
        self.current_chapter = ""
        self.current_verse = ""
        self.list = [["Book","Chapter","Verse","Text","Type","Marker"]]
        self.bible_nlp_format = { "text" : [], "vref":[] }
        self.prev_chapter = ""
        self.prev_verse = ""

    def usj_to_list_id(self, obj):
        '''update book code'''
        self.book = obj['code']

    def usj_to_list_c(self, obj):
        '''Update current chapter'''
        self.current_chapter = obj['number']

    def usj_to_list_v(self, obj):
        '''Update current verse'''
        self.current_verse = obj['number']

    def usj_to_list(self, obj):
        '''Traverse the USJ dict and build the table in self.list'''
        if obj['type'] == "book":
            self.usj_to_list_id(obj)
        elif obj['type'] == "chapter":
            self.usj_to_list_c(obj)
        elif obj['type'] == "verse":
            self.usj_to_list_v(obj)
        marker_type = obj['type']
        marker_name = obj['marker'] if "marker" in obj else ''
        if marker_type == "USJ":
            # This would occur if the JSON got flatttened after removing paragraph markers
            marker_type = ""
        if 'content' in obj:
            for item in obj['content']:
                if isinstance(item, str):
                    self.list.append(
                        [self.book, self.current_chapter, self.current_verse,
                            item, marker_type, marker_name])
                else:
                    self.usj_to_list(item)


    def usj_to_bible_nlp_format(self, obj):
        '''Traverse the USJ dict and build a dict for bible nlp format, in self.bible_nlp_format'''
        if obj['type'] == "book":
            self.usj_to_list_id(obj)
        elif obj['type'] == "chapter":
            self.usj_to_list_c(obj)
        elif obj['type'] == "verse":
            self.usj_to_list_v(obj)
        marker_type = obj['type']
        marker_name = obj['marker'] if "marker" in obj else ''
        if marker_type == "USJ":
            # This would occur if the JSON got flatttened after removing paragraph markers
            marker_type = ""
        if marker_type != "book" and 'content' in obj:
            for item in obj['content']:
                if isinstance(item, str):
                    if self.current_chapter == self.prev_chapter and self.current_verse==self.prev_verse:
                        self.bible_nlp_format["text"][-1] += " "+item.replace("\n", " ").strip()
                    else:
                        vref = f"{self.book} {self.current_chapter}:{self.current_verse}"
                        self.bible_nlp_format["text"].append(item.replace("\n", " ").strip())
                        self.bible_nlp_format["vref"].append(vref)
                        self.prev_chapter = self.current_chapter
                        self.prev_verse = self.current_verse
                else:
                    self.usj_to_bible_nlp_format(item)

