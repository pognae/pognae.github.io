Jekyll::Hooks.register :documents, :post_init do |doc|
  if doc.data['title']
    doc.data['title'] = doc.data['title'].gsub('**', '').gsub('*', '').gsub('`', '').gsub('#', '').gsub("\n", " ").gsub("\r", " ").strip.gsub(/\s+/, ' ')
  end
  if doc.data['description']
    doc.data['description'] = doc.data['description'].gsub('**', '').gsub('*', '').gsub('`', '').gsub('#', '').gsub("\n", " ").gsub("\r", " ").strip.gsub(/\s+/, ' ')
  end
end

Jekyll::Hooks.register :pages, :post_init do |page|
  if page.data['title']
    page.data['title'] = page.data['title'].gsub('**', '').gsub('*', '').gsub('`', '').gsub('#', '').gsub("\n", " ").gsub("\r", " ").strip.gsub(/\s+/, ' ')
  end
  if page.data['description']
    page.data['description'] = page.data['description'].gsub('**', '').gsub('*', '').gsub('`', '').gsub('#', '').gsub("\n", " ").gsub("\r", " ").strip.gsub(/\s+/, ' ')
  end
end
