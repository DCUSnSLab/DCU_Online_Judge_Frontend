import re

def extract_block(text, start_str, end_str):
    start_idx = text.find(start_str)
    if start_idx == -1: return ""
    end_idx = text.find(end_str, start_idx)
    if end_idx == -1: return ""
    return text[start_idx:end_idx + len(end_str)]

def main():
    file_path = '/Users/soobinjeon/Git-projects/DCU_Online_Judge_Frontend/src/pages/oj/views/problem/Problem.vue'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    template_start = content.find('<template>')
    template_end = content.find('</template>\n\n<script>') + len('</template>')
    
    if template_end < len('</template>'):
        print("Failed to find end of template")
        return
        
    template_content = content[template_start:template_end]

    # Problem block
    problem_block = extract_block(template_content, '<Panel :padding="40" shadow style="height: 100%">', '</Panel>')
    anti_card = extract_block(template_content, '<Card dis-hover>\n          <div style="display: flex; justify-content: flex-end; gap: 10px;">', '</Card>')

    # Code block
    code_start_idx = template_content.find('<Card id="submit-code" dis-hover>')
    code_end_idx = template_content.find('<!-- LLM Hint Card', code_start_idx)
    code_block = template_content[code_start_idx:code_end_idx]
    
    # We want to keep everything until the second </Card> which closes the submit-code card.
    # We know the landscape code block ends with:
    #         </Card>
    #       </Card>
    #       </el-col>
    code_block = code_block[:code_block.rfind('</Card>') + 7]

    # LLM hint (landscape)
    llm_hint_start = template_content.find('<Card v-if="llmHintVisible && toggleValue" id="llm-hint" dis-hover>')
    llm_hint_end = template_content.find('</div>\n      </Card>', llm_hint_start) + len('</div>\n      </Card>')
    llm_hint_str = template_content[llm_hint_start:llm_hint_end]
    llm_hint_str = llm_hint_str.replace('v-if="llmHintVisible && toggleValue"', '')

    # Right column menus
    menu_block = extract_block(template_content, '<VerticalMenu', '</VerticalMenu>')
    info_block = extract_block(template_content, '<Card id="info">', '</ul>\n      </Card>')
    pie_block = extract_block(template_content, '<Card id="pieChart"', '</Card>')

    # Modals
    sidebar1 = extract_block(template_content, '<b-sidebar id="sidebar-right"', '</b-sidebar>')
    sidebar2 = extract_block(template_content, '<b-sidebar id="sidebar-airight"', '</b-sidebar>')
    modal1 = extract_block(template_content, '<Modal v-model="graphVisible">', '</Modal>')
    transition1 = extract_block(template_content, '<transition name="fade">', '</transition>')

    new_template = """<template>
  <div class="problem-layout-container" :style="currentTheme">
    
    <!-- 1. Menu Pane -->
    <div class="pane menu-pane" :class="{'pane-collapsed': !menuExpanded}">
      <div v-show="menuExpanded" class="pane-content pane-scroll">
        <div class="pane-header">
          <span class="title" style="font-weight: bold; margin-left: 10px;">메뉴</span>
          <icon type="chevron-left" @click="menuExpanded = false" class="toggle-btn"></icon>
        </div>
        """ + menu_block + """
        <br />
        """ + info_block + """
        <br />
        """ + pie_block + """
      </div>
      <div v-show="!menuExpanded" class="pane-collapsed-content" @click="menuExpanded = true">
        <icon type="navicon-round" size="24"></icon>
      </div>
    </div>

    <!-- 2. Problem Pane -->
    <div class="pane problem-pane">
      """ + problem_block + """
      <br />
      """ + anti_card + """
    </div>

    <!-- 3. Code Pane -->
    <div class="pane code-pane pane-scroll">
      """ + code_block + """
    </div>

    <!-- 4. AI Hint Pane -->
    <div class="pane ai-pane" :class="{'pane-collapsed': !aiHintExpanded}" v-if="llmHintVisible">
      <div v-show="aiHintExpanded" class="pane-content pane-scroll" style="height: 100%">
        <div class="pane-header">
          <span class="title">🤖 AI 힌트</span>
          <icon type="chevron-right" @click="aiHintExpanded = false" class="toggle-btn"></icon>
        </div>
        """ + llm_hint_str + """
      </div>
      <div v-show="!aiHintExpanded" class="pane-collapsed-content" @click="aiHintExpanded = true">
        <span class="vertical-text">AI 힌트 열기...</span>
      </div>
    </div>

    """ + sidebar1 + """
    """ + sidebar2 + """
    """ + modal1 + """
    """ + transition1 + """
  </div>
</template>"""

    new_content = content[:template_start] + new_template + content[template_end:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("Template Replaced Successfully")

if __name__ == "__main__":
    main()
