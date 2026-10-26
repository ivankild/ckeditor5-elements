---
layout: home
title: 'Element-first WYSIWYG editing and CKEditor 5 customization'
description: 'Customize CKEditor 5 for structured content: a WYSIWYG editor whose content is a tree of named elements, declared from a JSON file, with element commands, menus and toolbars, saved as HTML or XML, e.g. DocBook XML and DITA XML.'
head:
    - - script
      - type: application/ld+json
      - '{"@context": "https://schema.org", "@type": "SoftwareSourceCode", "name": "CKEditor 5 Elements", "description": "Element-first WYSIWYG editing for CKEditor 5: element commands, menus, toolbars and a JSON element schema to customize CKEditor 5, for structured content and XML such as DocBook XML and DITA XML.", "url": "https://ivankild.github.io/ckeditor5-elements/", "codeRepository": "https://github.com/ivankild/ckeditor5-elements", "programmingLanguage": "TypeScript", "runtimePlatform": "CKEditor 5", "license": "https://opensource.org/licenses/MIT", "keywords": "CKEditor 5, CKEditor 5 customization, WYSIWYG editor, XML editor, DocBook XML, DITA XML, structured content"}'

hero:
    name: CKEditor 5 Elements
    text: Element-first WYSIWYG editing for CKEditor 5
    tagline: Customize CKEditor 5 for structured content. The content is a tree of named elements, declared from a JSON file, and every feature acts on an element, formatting included. Save it as HTML, or as XML, such as DocBook XML and DITA XML.
    actions:
        - theme: brand
          text: Get started
          link: /guide/getting-started
        - theme: alt
          text: Try the examples
          link: /examples/
        - theme: alt
          text: API reference
          link: /api/

features:
    - title: Commands
      details: ElementOrPositionCommand knows its title, icon and state for any element, so buttons and menus can use it.
      link: /guide/commands
    - title: Actions
      details: Move an element up or down, duplicate it as an empty element of the same kind, or delete it.
      link: /guide/actions
    - title: Clipboard
      details: Copy, cut and paste whole elements, before or after another element, from a menu, a button or code.
      link: /guide/clipboard
    - title: Attributes
      details: Show the attributes of an element, as key-value pairs, in a modal, from a menu, a toolbar, a click or code.
      link: /guide/attributes
    - title: Context menu
      details: Right-click an element to get a menu of commands, submenus and separators, configured per element.
      link: /guide/context-menu
    - title: Breadcrumbs
      details: The element path at the cursor, as labels or as buttons that open a menu of the element.
      link: /guide/breadcrumbs
    - title: Quick insert
      details: Alt+Enter, or a menu item, opens a searchable list of the elements allowed at a position.
      link: /guide/quick-insert
    - title: Selectable elements
      details: Select an element as a whole, by a click on its frame or by the arrow keys, without widgets.
      link: /guide/selectable
    - title: Clickable elements
      details: Call a function, with the model element, when an element that matches a name or a filter is clicked or double-clicked.
      link: /guide/clickable
    - title: Element toolbar
      details: A floating toolbar for the elements you choose, by name or filter, with buttons that act on the element.
      link: /guide/toolbar
    - title: DocBook XML and DITA XML editors
      details: Two WYSIWYG XML editors built with CKEditor 5 Elements, live, with their source. A Simplified DocBook article and a Lightweight DITA topic are edited visually, and saved as XML, element for element.
      link: /examples/docbook
    - title: Element schema
      details: Declare the elements of the content from a JSON file, what each one holds and where it goes, with a validation that rejects contradictions. Give every element a command and a button, formatting included.
      link: /guide/schema
---
