<template>
  <div class="page-container">
    <div class="section">
      <div class="section-header">
        <h1 class="section-title">
          <font-awesome-icon :icon="['fas', 'file-alt']" class="section-icon" />
          Terms of Service
        </h1>
        <p class="text-secondary">Effective Date: July 27, 2025</p>
      </div>
      
      <div class="legal-content">
        <!-- Professional Introduction -->
        <div class="intro-section">
          <p>Welcome to 4track's Terms of Service. This document constitutes a legally binding agreement between you and 4track. We strongly encourage you to read these terms carefully before using our platform. While we've structured this document to be as clear and accessible as possible, it contains important information about your rights and obligations when using our service.</p>
          
          <p>To help you navigate this document, we've prepared answers to frequently asked questions:</p>
          
          <div class="faq-section mt-lg">
            <h3 class="text-primary">Information for Artists:</h3>
            <ol>
              <li><strong>What rights does 4track claim over my music?</strong> We claim no ownership of your content. We only require the necessary licenses to operate the service, such as hosting, streaming, and distributing your music as you direct. Full details are provided in <a href="#intellectual-property-artists">Section 15</a>.</li>
              <li><strong>What content may I upload? Are cover songs permitted?</strong> You must possess all necessary rights to any content you upload. Cover songs require written authorization from the copyright holder. Unauthorized uploads, including covers without proper licensing, may result in content removal and account suspension. This applies to all content regardless of pricing. Complete guidelines are in <a href="#intellectual-property-artists">Section 15</a>.</li>
              <li><strong>What are the platform fees?</strong> For self-hosted instances: 4track charges no fees. For our hosted service: we charge 2% of revenue after PayPal fees. Artists receive the remainder (approximately 95% of the original payment). See the <a href="#fees">fees section</a> for complete details.</li>
            </ol>
            
            <h3 class="text-primary mt-md">Information for Listeners:</h3>
            <ol>
              <li><strong>How does 4track handle my personal data?</strong> We maintain strict privacy standards as detailed in our <router-link to="/privacy">Privacy Policy</router-link>. Artists you support will receive limited contact information (email and country) for their direct communications. See our Privacy Policy for complete information.</li>
              <li><strong>How much of my payment reaches the artist?</strong> For self-hosted instances: Artists receive 100% minus PayPal fees. For our hosted service: Artists receive approximately 95% (we take 2% after PayPal's fee). For collaborative works, payments are automatically distributed according to artist-configured splits. See our Fair Trade Music Policy in the <a href="#fees">fees section</a>.</li>
              <li><strong>What does "open source" mean for users?</strong> Our platform code is available under the MIT License for transparency and community contribution. However, all user-uploaded content remains the exclusive property of its creators. See <a href="#open-source">Section 3</a> for details.</li>
            </ol>
          </div>
          
          <p class="mt-lg fw-bold">The following constitutes the complete Terms of Service agreement:</p>
        </div>

        <p>These Terms of Service ("Agreement" or "Terms") constitute a binding legal agreement between you and Alpha Pup LLC, doing business as 4track ("4track," "Company," "we," "us," or "our"). This Agreement governs your access to and use of the website located at 4track.io (the "Site") and all related services provided by Company, including any mobile applications published by Company (collectively with the Site, the "Service"). By accessing or using any part of the Service, including browsing the Site or uploading content, you acknowledge that you have read, understood, and agree to be bound by these Terms. These Terms apply to all users of the Service, including users who contribute content, information, and other materials or services.</p>

        <h2 id="acceptance">1. Acceptance of Terms</h2>
        <p>The Service is provided subject to your acceptance of these Terms without modification. These Terms incorporate by reference our Privacy Policy available at <router-link to="/privacy">4track.io/privacy</router-link>, and all other operating rules, policies, and procedures published on the Site, each of which is incorporated by reference and may be updated periodically without advance notice. Additional terms may apply to specific services, and your use of such services is subject to those additional terms, which are incorporated into these Terms by reference.</p>
        
        <p>If you are using or opening an account on behalf of a company, entity, organization, band, or musical group (including record labels) (each an "Artist Entity"), you represent and warrant that: (i) you are an authorized representative of that Artist Entity and any recording artists represented by such Artist Entity (a "Represented Artist") with the authority to bind such Artist Entity or Represented Artist to these Terms, and (ii) you accept these Terms on behalf of such Artist Entity and/or Represented Artist.</p>
        
        <p>The Service is available only to individuals aged 18 years or older. By using the Service, you represent and warrant that you are of legal age to form a binding contract, and that all registration information you provide is accurate and truthful. We may, at our sole discretion, refuse to offer the Service to any person or entity and change eligibility criteria at any time. This provision is void where prohibited by law, and the right to access the Service is revoked in such jurisdictions.</p>

        <h2>2. Modifications to Terms</h2>
        <p>We reserve the right, at our sole discretion, to modify or replace any portion of these Terms, or change, suspend, or discontinue the Service (including without limitation, the availability of any feature, database, or content) at any time by posting a notice on the Site or by sending you an email. We may also impose limits on certain features and services or restrict your access to parts or all of the Service without notice or liability. It is your responsibility to check these Terms periodically for changes. Your continued use of the Service following the posting of any changes constitutes acceptance of those changes. Notwithstanding the preceding sentences, no modifications to these Terms will apply to any dispute between you and Company that arose prior to the date of such modification.</p>

        <h2 id="open-source">3. Open Source License and Platform Code</h2>
        <p>The 4track platform software is released under the MIT License and is available at github.com/4track/4track. This licensing structure means:</p>
        <ul>
          <li>The platform source code is freely available for anyone to use, modify, and distribute</li>
          <li>You may host your own instance of 4track with no fees or revenue sharing</li>
          <li>You may contribute improvements back to the project</li>
          <li><span class="text-warning fw-bold">Critical:</span> The open source license applies ONLY to the platform code itself, NOT to any music, artwork, or other content uploaded by users</li>
          <li>All user-uploaded content remains the sole property of the respective copyright holders</li>
          <li>Running your own instance does not grant any rights to content uploaded to 4track.io or any other instance</li>
        </ul>

        <h2>4. Privacy</h2>
        <p>Your privacy is important to us. Please review our Privacy Policy at <router-link to="/privacy">4track.io/privacy</router-link>. It describes how we collect, use, and share information when you use the Site and Services that link to this Privacy Policy.</p>

        <h2>5. Rules and Conduct</h2>
        <p>As a condition of use, you promise not to use the Service for any purpose that is prohibited by these Terms. The Service is provided only for your own personal, non-commercial use (except with respect to individual recording artists, collections of recording artists, Artist Entities or Represented Artists (each, an "Artist") selling Music, Merchandise or other Content as authorized through the Service). You are responsible for all of your activity in connection with the Service.</p>
        
        <p>By way of example, and not as a limitation, when using the Service, you shall not:</p>
        <ul>
          <li>Upload, post, transmit or otherwise make available any Content that:
            <ul>
              <li>infringes any patent, trademark, trade secret, copyright or other proprietary rights of any party</li>
              <li>is fraudulent, unlawful, threatening, abusive, harassing, libelous, defamatory, obscene or otherwise objectionable</li>
              <li>constitutes unauthorized or unsolicited advertising, junk or bulk e-mail ("spam")</li>
              <li>contains software viruses or any other computer code designed to interrupt, destroy, or limit functionality</li>
              <li>impersonates any person or entity, or falsely states or misrepresents your affiliation</li>
            </ul>
          </li>
          <li>Take any action that imposes an unreasonable or disproportionately large load on our infrastructure</li>
          <li>Use any device, software or routine to interfere with the proper working of the Service</li>
          <li>Use the Service to violate any applicable law or regulation</li>
          <li>Attempt to gain unauthorized access to any portion of the Service or any other systems or networks</li>
          <li>Remove any copyright, trademark or other proprietary notices from any portion of the Service</li>
          <li>Frame or mirror any part of the Service without our express prior written consent</li>
        </ul>

        <p>The term "Content" includes, without limitation, any User Submissions, videos, audio clips, written forum comments, information, data, text, photographs, software, scripts, graphics, and interactive features generated, provided, or otherwise made accessible by Company or its partners on or through the Service.</p>

        <h2>6. Fan Personal Information – Fans</h2>
        <p>Please see our <router-link to="/privacy">Privacy Policy</router-link> for information on how we collect, use, share and safeguard personal information. Company requires each Artist to agree to the terms set forth in the next section of this Agreement. However, you acknowledge that Company has no control over Artists' use of personal information about fans, such as your email address, country of residence and zip/postal code ("Fan Information"), and you further acknowledge and agree that 4track shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the Artists' use of such Fan Information.</p>

        <h2>7. Fan Personal Information - Artists</h2>
        <p>In connection with certain features of the Service, including by requiring that fans provide you with their email addresses and other personal information in order to access free downloads, you may collect certain types of Fan Information. You acknowledge and agree that you will not disclose, rent, or sell any Fan Information to any third party, and you will use the Fan Information only in connection with the Artist's mailing list or Artist subscriptions, in order to provide fans with general information and news about the Artist, such as upcoming shows, new Music or other Content. You further agree that any email or other communication sent to the Artist's mailing list or sent in connection with Artist features will comply with all applicable email marketing laws and include a mechanism by which the recipient can unsubscribe from the mailing list, along with clear instructions on how to do so (i.e., a functioning "opt-out" mechanism). You will promptly implement a recipient's request to opt-out of receiving emails from you and will not send any further emails to such opting-out recipient.</p>

        <h2>8. Registration</h2>
        <p>You may browse the Site and view Content without registering, but as a condition to using certain aspects of the Service, you are required to register with Company and select a password and username ("User ID"). You shall provide Company with accurate, complete, and updated registration information. Failure to do so shall constitute a breach of these Terms, which may result in immediate termination of your Company account. You shall not (i) select or use as a User ID or domain a name of another person with the intent to impersonate that person; (ii) use as a User ID or domain a name subject to any rights of a person other than you without appropriate authorization; or (iii) use as a User ID or domain a name that is otherwise offensive, vulgar or obscene. Company reserves the right to refuse registration of, or cancel a User ID and domain in its sole discretion. You are solely responsible for activity that occurs on your account and shall be responsible for maintaining the confidentiality of your Company password. You shall never use another user's account without such other user's express permission. You will immediately notify Company in writing of any unauthorized use of your account, or other account-related security breach of which you are aware.</p>

        <h2 id="fees">9. Fees and Payments – General</h2>
        <p>4track enables fans to purchase Content from Artists, including digital Content made available via download (and, subject to the purchase of a download, streaming) through the Service ("Digital Content"). Each such purchase is a "Transaction."</p>
        
        <div class="card bg-tertiary p-lg mb-lg">
          <h3 class="mt-0 text-primary">4track Fee Structure</h3>
          <p class="fw-bold">For Self-Hosted Instances:</p>
          <p class="mb-sm"><strong>Platform Fees:</strong> $0 (Zero)</p>
          <p class="mb-sm"><strong>Commission:</strong> 0%</p>
          <p class="mb-lg"><strong>Result:</strong> Artists receive 100% of payments (minus only PayPal fees)</p>
          
          <p class="fw-bold">For Our Hosted Service:</p>
          <p class="mb-sm"><strong>Platform Fee:</strong> 2% of revenue (calculated after PayPal fees)</p>
          <p class="mb-sm"><strong>PayPal Fees:</strong> Typically 2.9% + $0.30</p>
          <p class="mb-0"><strong>Result:</strong> Artists receive approximately 95% of the original payment</p>
        </div>

        <h2>10. Fees and Payments – Terms for Fans</h2>
        <p>Fans may purchase products and/or services from an Artist through the Site, including Digital Content.</p>
        
        <p>All sales of Digital Content are final (except where prohibited by law), unless otherwise determined by 4track. If you do not receive the Digital Content or otherwise have an issue with the Digital Content delivered, please contact 4track with your request and proof of payment, and we will notify the relevant Artist and work with them to resolve your issue. At 4track's sole discretion, you may be credited or refunded for the Digital Content. However, you understand and agree that 4track is a platform that Artists use to sell their products, and the Digital Content is derived from files provided by the relevant Artist, and the relevant Artist is solely responsible for such files.</p>
        
        <p>Your total price for each Transaction will include the price of the product plus any applicable tax. If a Transaction is subject to any type of sales tax, value added tax, goods and services tax, or similar indirect tax (collectively, "Sales Tax"), then you agree that we may charge you for those Sales Taxes and that you will pay all the fees and Sales Taxes you incur as applicable.</p>
        
        <p>Content you purchase in a Transaction cannot be guaranteed to be available to you perpetually. For example, if we receive a notification of claimed infringement from a copyright owner or its agent with respect to specific Content, then we may be required by law to remove that Content from the Service and not make it available for future sale and we may also have to deny continued access to anyone who previously purchased such Content. This means that you may lose access to purchased Content previously available to you through the Service.</p>
        
        <p class="text-warning fw-bold">Because there is a possibility that we may be required to deny you access to previously purchased Content, we encourage you to promptly download any Content you purchase through the Site to your own devices so that you will retain control and possession of such Content even if we are required to remove the Content from the Service or the Artist chooses to remove that content from the Service.</p>
        
        <p>You warrant that if you enter into a Transaction, then you shall be able to make full and immediate payment for the requested products or services.</p>

        <h2>11. Fees and Payments – Terms for Artists</h2>
        <p>Artists may sell products and/or services to fans through the Site, including Digital Content. You will set the prices for your products (the "Prices") through the Site, from $0 to $10 per track, and you may change the Prices at your sole discretion. Notwithstanding the preceding sentence, 4track may redistribute previously purchased copies of your products to users who have, in 4track's sole determination, received a corrupted copy, an incorrect file format version, or suffered a loss through hard drive failure, on a no-fee basis (i.e., the user is not charged a new fee). Such redistribution may be effectuated by allowing a user to redownload a replacement copy. Users with accounts will also be permitted to redownload any previously purchased Content. In such cases, no additional payments shall be made to you.</p>
        
        <h3>11.1 Payment Processing</h3>
        <p>All payments are processed directly through PayPal. Requirements include:</p>
        <ul>
          <li>Active PayPal account to receive payments</li>
          <li>For self-hosted instances: Payment sent directly to your PayPal account</li>
          <li>For hosted service: Payment sent to 4track, then distributed minus 2% platform fee</li>
          <li>4track does not hold funds for self-hosted instances</li>
          <li>You are responsible for PayPal fees (typically 2.9% + $0.30 per transaction)</li>
          <li>Free tracks ($0) bypass payment processing</li>
        </ul>
        
        <h3>11.2 Revenue Share (Hosted Service Only)</h3>
        <p>For Artists using our hosted service at 4track.io, Company shall be entitled to a share of the revenue received from Transactions (the "Revenue Share"), which shall be calculated as 2% of your gross revenue from Transactions after PayPal fees are deducted. This means:</p>
        <ul>
          <li>PayPal deducts their fee first (typically 2.9% + $0.30)</li>
          <li>4track calculates 2% of the remaining amount</li>
          <li>You receive approximately 95% of the original payment amount</li>
          <li>For self-hosted instances, there is no Revenue Share</li>
        </ul>
        
        <h3>11.3 Collaborative Revenue Distribution</h3>
        <p>4track's unique royalty split feature allows automatic payment distribution among collaborators:</p>
        <ul>
          <li>Add any number of collaborators to a track</li>
          <li>Each collaborator must have a valid PayPal email address</li>
          <li>Split percentages must total exactly 100%</li>
          <li>PayPal automatically sends each collaborator their percentage</li>
          <li>You are solely responsible for split accuracy</li>
          <li>You warrant that you have authority to designate payment splits</li>
          <li>Disputes regarding splits must be resolved between collaborators</li>
        </ul>
        
        <h3>11.4 Tax Responsibilities</h3>
        <p>You are solely responsible for any and all taxes on income received through the Service. In certain jurisdictions, tax regulations may require that we collect and/or report information about you, your payments and/or withhold taxes from payouts to you. 4track will report any information to the relevant tax authority and you as required by law. 4track may withhold any taxes, duties, charges or levies on payments to you as required by law and shall remit such amounts to the appropriate tax authority. You are required to provide 4track with any information necessary for 4track to fulfill its tax information reporting and tax withholding obligations.</p>
        
        <h3>11.5 Refunds and Disputes</h3>
        <p>For self-hosted instances: As payments go directly to Artists via PayPal, refund requests and disputes must be handled between you and the purchaser through PayPal's resolution system. For hosted service: 4track may, at its discretion, issue refunds on your behalf and deduct such amounts from future payments to you.</p>

        <h3>11.6 EU/UK Trader Requirements</h3>
        <p>We require that any Artist who is defined as a "trader" under UK or EU laws, identifies as such. If you fail to identify as a trader when required, you may be subject to penalties under local consumer protection laws. Identifying as a trader will require you to provide certain information for verification and will require us to publish certain information about you to all consumers, including your name, address, email address and phone number. Additionally, all traders are required to comply with UK and EU consumer laws including but not limited to operating a 14-day return policy for all physical products sold to UK and EU consumers. If we refuse or suspend you from operating on our website, you have a right to complain by submitting an email to terms@4track.io. Your complaint will be reviewed by our counsel and we will aim to reply within 8 weeks.</p>

        <h2>12. Additional Services</h2>
        <p>We reserve the right to require payment of fees for certain additional features of the Service. Should you elect to subscribe to such features, you shall pay all applicable fees, as described on the Site in connection with such features. We reserve the right to change our price list and to institute new charges at any time, upon ten (10) days prior notice to you, which may be sent by email or posted on the Site. Use of the Service by you following such notification constitutes your acceptance of any new or increased charges.</p>

        <h2>13. Third Party Sites</h2>
        <p>The Service may permit you to link to other websites or resources on the Internet, and other websites or resources may contain links to the Site. When you access third party websites, you do so at your own risk. These other websites are not under Company's control, and you acknowledge that Company is not responsible or liable for the content, functions, accuracy, legality, appropriateness or any other aspect of such websites or resources. The inclusion of any such link does not imply endorsement by Company or any association with its operators. You further acknowledge and agree that Company shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods or services available on or through any such website or resource.</p>

        <h2>14. Content and License</h2>
        <p>You agree that the Service contains Content specifically provided by Company or its partners and that such Content is protected by copyrights, trademarks, service marks, patents, trade secrets or other proprietary rights and laws. You shall abide by and maintain all copyright notices, information, and restrictions contained in any Content accessed through the Service.</p>
        
        <p>Company grants each user of the Site and/or Service a worldwide, non-exclusive, non-sublicensable and non-transferable license to use, modify and reproduce the Content, solely for personal, non-commercial use. Use, reproduction, modification, distribution or storage of any Content for other than personal, non-commercial use is expressly prohibited without prior written permission from Company, or from the copyright holder identified in such Content's copyright notice. You shall not sell, license, rent, or otherwise use or exploit any Content for commercial use or in any way that violates any third party right.</p>

        <h2 id="intellectual-property-artists">15. Intellectual Property Rights – Artists</h2>
        <p>The Service provides Artists with the ability to upload Digital Content owned or controlled by such Artists to the Site, including but not limited to sound recordings ("Sound Recordings"), videos synchronized with Sound Recordings and other audiovisual works (collectively, "Music Videos"), and the musical works embodied within Sound Recordings and Music Videos ("Musical Works" and, collectively with Sound Recordings and Music Videos, the Artist's "Music"). Company will not have any ownership rights in any elements of an Artist's Music, however, Company needs the following license to perform the Service.</p>
        
        <h3>15.1 License Grant</h3>
        <p>Each Artist uploading Music to the Service grants Company and its authorized sublicensees and distributors, if any, the worldwide, non-exclusive, royalty-free, right and license to:</p>
        <ul>
          <li>Reproduce, distribute, publicly perform (including on a through-to-the-audience basis and by means of a digital audio transmission), publicly display, create derivative works of, communicate to the public, synchronize and otherwise exploit the Artist's Music to perform the Service on the Artist's behalf (e.g., reproduce, transcode, copy and store the Artist's Music on computer servers, and publicly perform, transmit, synchronize, stream, distribute, and playback the Artist's Music)</li>
          <li>Allow users of the Service to receive public performances and public displays of the Artist's Music and to reproduce the Artist's Music on any and all devices for non-commercial purposes</li>
          <li>Reproduce, use, and publish all associated copyrightable works or metadata, including album cover artwork, photographs, graphics, and descriptive text ("Artworks") in connection with the Service</li>
          <li>Use, reproduce, and publish the name(s), trademarks, likenesses, and personal and biographical materials of the Artist, in connection with the provision of the Service</li>
        </ul>
        
        <p class="text-warning fw-bold">Notwithstanding the foregoing, 4track will not use, and will not permit others to use, any Artist's Music to train models to generate sound recordings, videos synchronized with sound recordings or other audiovisual works, or musical works embodied within sound recordings and music videos, without that Artist's express permission.</p>
        
        <h3>15.2 Your Representations and Warranties</h3>
        <p>By uploading any Music or Artworks to the Site, you represent and warrant, and can demonstrate to Company's full satisfaction upon request, that:</p>
        <ol>
          <li>You own or otherwise control all rights to your Music and Artworks (or that such Music and Artworks are in the public domain or have been directly licensed to you in writing with sufficient rights to grant the licenses herein)</li>
          <li>You have full authority to act on behalf of any and all owners of any right, title or interest in and to any Music you upload to the Service and to the Artworks</li>
          <li>You have permission to use the name and likeness of each identifiable individual person whose name or likeness is contained or used within the Music and/or Artworks</li>
          <li>You are authorized to grant all of the aforementioned rights to the Music and/or Artworks to Company and all users of the Service</li>
          <li>The use or other exploitation of your Music and/or Artworks by Company and its authorized sublicensees and distributors and/or by users of the Site as contemplated by this Agreement will not infringe or violate the rights of any third party</li>
          <li>To the extent that you identify a songwriter as NOT being affiliated with a performing rights organization (PRO), mechanical rights organization (MRO) or collective management organization (CMO), no fees or payments of any kind shall be due from 4track to any such organization</li>
          <li>No fees of any kind shall be due from 4track to any third party (except for PROs, MROs, or CMOs where properly disclosed), including unions, guilds, non-featured performers, engineers, or producers</li>
        </ol>
        
        <div class="card bg-warning p-lg mt-lg mb-lg">
          <h3 class="mt-0">Critical Notice: Cover Songs and Copyright Compliance</h3>
          <p class="mb-0">Do not upload cover songs unless you have obtained written permission from the copyright owner of the composition. This requirement applies regardless of whether you're selling the music or giving it away for free. Unauthorized cover songs violate copyright law and may result in copyright strikes, content removal, and account termination. If any agreement you have entered into prohibits you from granting the rights set forth in this Agreement, you are prohibited from uploading such music to the Service.</p>
        </div>

        <h2>16. Intellectual Property Rights - Fans</h2>
        <p>The Service provides users with the ability to add, create, upload, submit, distribute or post content, videos, audio clips, written forum comments, data, text, photographs, or other information to the Site (collectively, "User Submissions"). By submitting User Submissions on the Site or through the Service, you:</p>
        <ul>
          <li>Acknowledge that by submitting any User Submission to the Site, you are publishing that User Submission, and that you may be identified publicly by your User ID</li>
          <li>Grant Company a worldwide, non-exclusive, perpetual, irrevocable, royalty-free, fully paid, sublicensable and transferable license to use, edit, modify, reproduce, distribute, prepare derivative works of, publicly display, publicly perform, and otherwise fully exploit the User Submissions in connection with the Site, the Service and Company's business</li>
          <li>Grant each user of the Site and/or the Service a non-exclusive license to access your User Submissions through the Site and the Service, and to use such User Submissions solely for personal, non-commercial use</li>
          <li>Represent and warrant that you own or control all rights to your User Submissions</li>
          <li>Agree that Company shall have the right to delete, edit, modify, reformat, excerpt, or translate any materials, content or information submitted by you</li>
          <li>Understand that Company cannot guarantee the identity of any other users with whom you may interact</li>
        </ul>

        <h2>17. Termination</h2>
        <p>Company may terminate your access to all or any part of the Service at any time, with or without cause, with or without notice, effective immediately, which may result in the forfeiture and destruction of all information associated with your membership, including any access to any Music you may have purchased through the Service. If you wish to terminate your account, you may do so by contacting support. Any fees paid hereunder are non-refundable, except as provided in this Agreement. All provisions of these Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.</p>

        <h2>18. Warranty Disclaimer</h2>
        <p>Company has no special relationship with or fiduciary duty to you. You acknowledge that Company has no control over, and no duty to take any action regarding: which users gain access to the Site; what Content you access via the Site; what effects the Content may have on you; how you may interpret or use the Content; or what actions you may take as a result of having been exposed to the Content. You release Company from all liability for you having acquired or not acquired Content through the Site. The Site may contain, or direct you to websites containing, information that some people may find offensive or inappropriate. Company makes no representations concerning any Content contained in or accessed through the Site, and Company will not be responsible or liable for the accuracy, copyright compliance, legality or decency of material contained in or accessed through the Site or the Service.</p>
        
        <p class="text-uppercase fw-bold">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" AND IS WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, AND ANY WARRANTIES IMPLIED BY ANY COURSE OF PERFORMANCE OR USAGE OF TRADE, ALL OF WHICH ARE EXPRESSLY DISCLAIMED. COMPANY, AND ITS DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, PARTNERS AND CONTENT PROVIDERS DO NOT WARRANT THAT: (A) THE SERVICE WILL BE SECURE OR AVAILABLE AT ANY PARTICULAR TIME OR LOCATION; (B) ANY DEFECTS OR ERRORS WILL BE CORRECTED; (C) ANY CONTENT OR SOFTWARE AVAILABLE AT OR THROUGH THE SERVICE IS FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS; OR (D) THE RESULTS OF USING THE SERVICE WILL MEET YOUR REQUIREMENTS. YOUR USE OF THE SERVICE IS SOLELY AT YOUR OWN RISK.</p>
        
        <p>Some states do not allow limitations on how long an implied warranty lasts, so the above limitations may not apply to you.</p>

        <h2>19. Electronic Communications Privacy Act Notice (18 U.S.C. §§ 2701-2711)</h2>
        <p>Company makes no guaranty of confidentiality or privacy of any communication or information transmitted on the Site or any website linked to the Site. Company will not be liable for the privacy of email addresses, registration and identification information, disk space, communications, confidential or trade-secret information, or any other Content stored on Company's equipment, transmitted over networks accessed by the Site, or otherwise connected with your use of the Service.</p>

        <h2>20. Indemnification</h2>
        <p>You shall defend, indemnify, and hold harmless Company and its affiliates, authorized sublicensees and distributors, and each of their employees, contractors, directors, suppliers and representatives, from any and all liabilities, claims, and expenses, including reasonable attorneys' fees and court costs, that arise from or relate to your use or misuse of, or access to, the Site, Service, Content or otherwise from your User Submissions, violation of these Terms, or infringement by you, or any third party using your account, of any intellectual property or other right of any person or entity, and for breach of any of your representations and warranties in these Terms. For the avoidance of doubt, you hereby agree to defend, indemnify, and hold harmless Company from any and all claims by a third party owning, controlling or claiming any right in or to your Music, including claims for performance royalties, synchronization royalties, mechanical royalties, and use or re-use fees. Company reserves the right to assume the exclusive defense and control of any matter otherwise subject to indemnification by you, in which event you will assist and cooperate with Company in asserting any available defenses at your sole expense.</p>

        <h2>21. Limitation of Liability</h2>
        <p class="text-uppercase fw-bold">IN NO EVENT SHALL COMPANY, NOR ITS DIRECTORS, EMPLOYEES, AGENTS, PARTNERS, SUPPLIERS OR CONTENT PROVIDERS, BE LIABLE UNDER CONTRACT, TORT, STRICT LIABILITY, NEGLIGENCE OR ANY OTHER LEGAL OR EQUITABLE THEORY WITH RESPECT TO THE SERVICE (I) FOR ANY LOST PROFITS, DATA LOSS, COST OF PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES, OR SPECIAL, INDIRECT, INCIDENTAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES OF ANY KIND WHATSOEVER, SUBSTITUTE GOODS OR SERVICES (HOWEVER ARISING), (II) FOR ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE (REGARDLESS OF THE SOURCE OF ORIGINATION), OR (III) FOR ANY DIRECT DAMAGES IN EXCESS OF (IN THE AGGREGATE) ONE HUNDRED U.S. DOLLARS ($100.00).</p>
        
        <p>Some states do not allow the exclusion or limitation of incidental or consequential damages, so the above limitations and exclusions may not apply to you.</p>

        <h2>22. Release</h2>
        <p>Because Company is not the buyer or seller in any Transaction, if a dispute arises between one or more participants in a Transaction, then you release Company (and its affiliates, agents and employees) from claims, demands and damages (actual and consequential) of every kind and nature, known and unknown, suspected and unsuspected, disclosed and undisclosed, arising out of or in any way connected with such disputes. If you are a California resident, then you waive California Civil Code §1542, which says: "A general release does not extend to claims that the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release and that, if known by him or her, would have materially affected his or her settlement with the debtor or released party." You, being aware of said code section, hereby expressly waive any rights you may have thereunder, as well as under any other statutes or common law principles of similar effect. You acknowledge and agree that this waiver is an essential and material term of this Agreement, and that without such waiver, this Agreement would not have been entered into by Company.</p>

        <h2>23. International/Non-California Use</h2>
        <p>Other than its requirements to comply with the EU's Digital Services Act, Company makes no representation that the Content is appropriate or available for use in locations outside of California. Save in respect of users based in the EU, if you access the Service from other locations, you do so at your own initiative and are responsible for compliance with local laws.</p>

        <h2>24. Dispute Resolution</h2>
        <p>A printed version of these Terms and of any notice given in electronic form shall be admissible in judicial or administrative proceedings based upon or relating to these Terms to the same extent and subject to the same conditions as other business documents and records originally generated and maintained in printed form. You and Company agree that any cause of action arising out of or related to the Service must commence within one (1) year after the cause of action arose; otherwise, such cause of action is permanently barred.</p>
        
        <p>These Terms shall be governed by and construed in accordance with the laws of the State of California, excluding its conflicts of law rules, and the United States of America. Any dispute arising from or relating to the subject matter of this Agreement shall be finally settled by arbitration in Los Angeles County, California, using the English language in accordance with the Arbitration Rules and Procedures of Judicial Arbitration and Mediation Services, Inc. ("JAMS") then in effect, by one commercial arbitrator with substantial experience in resolving intellectual property and commercial contract disputes, who shall be selected from the appropriate list of JAMS arbitrators in accordance with the Arbitration Rules and Procedures of JAMS. The prevailing party in the arbitration shall be entitled to receive reimbursement of its reasonable expenses (including reasonable attorneys' fees, expert witness fees and all other expenses) incurred in connection therewith. Judgment upon the award so rendered may be entered in a court having jurisdiction or application may be made to such court for judicial acceptance of any award and an order of enforcement, as the case may be. Notwithstanding the foregoing, each party shall have the right to institute an action in a court of proper jurisdiction for injunctive or other equitable relief pending a final decision by the arbitrator. For all purposes of this Agreement, the parties consent to exclusive jurisdiction and venue in the United States Federal Courts or state courts located in Los Angeles, California. Use of the Service is not authorized in any jurisdiction that does not give effect to all provisions of these Terms, including without limitation, this section.</p>

        <h2>25. Integration and Severability</h2>
        <p>These Terms constitute the entire agreement between you and Company with respect to the Service and use of the Site, and supersede all prior or contemporaneous communications and proposals (whether oral, written or electronic) between you and Company with respect to the Site. If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect and enforceable. The failure of either party to exercise in any respect any right provided for herein shall not be deemed a waiver of any further rights hereunder.</p>

        <h2>26. Miscellaneous</h2>
        <p>Company shall not be liable for any failure to perform its obligations hereunder where such failure results from any cause beyond Company's reasonable control, including, without limitation, mechanical, electronic or communications failure or degradation (including "line-noise" interference). These Terms are personal to you, and are not assignable, transferable or sublicensable by you except with Company's prior written consent. Company may assign, transfer or delegate any of its rights and obligations hereunder without consent. No agency, partnership, joint venture, or employment relationship is created as a result of these Terms and neither party has any authority of any kind to bind the other in any respect. In any action or proceeding to enforce rights under these Terms, the prevailing party will be entitled to recover costs and attorneys' fees. All notices under these Terms will be in writing and will be deemed to have been duly given when received, if personally delivered or sent by certified or registered mail, return receipt requested; when receipt is electronically confirmed, if transmitted by facsimile or email; or the day after it is sent, if sent for next day delivery by recognized overnight delivery service. The captions and headings in this Agreement are intended only for convenience, and will in no event be construed to define, limit or describe the scope or intent of this Agreement, or of any provision of this Agreement, nor in any way affect the interpretation of this Agreement.</p>

        <h2>27. Open Source Contributions</h2>
        <p>If you contribute code to the 4track open source project:</p>
        <ul>
          <li>You represent that you have the right to submit the contributions under the MIT License</li>
          <li>You grant the project a perpetual, worldwide, non-exclusive, royalty-free license to use your contributions</li>
          <li>You understand that your contributions may be included in the project and distributed under the MIT License</li>
        </ul>

        <h2>28. Contact</h2>
        <p>You may contact Company by directing inquiries to our support team:</p>
        <div class="card p-lg">
          <p class="mb-sm"><strong>Email:</strong> legal@4track.io</p>
          <p class="mb-sm"><strong>GitHub:</strong> github.com/4track/4track</p>
          <p class="mb-sm"><strong>Support:</strong> support@4track.io</p>
          <p class="mb-0"><strong>Mailing Address:</strong> 3306 Glendale Blvd, Los Angeles, CA 90039 US</p>
        </div>

        <!-- Change Log -->
        <div class="mt-xl">
          <h2>29. Change Log</h2>
          <div class="card p-lg">
            <p class="mb-0"><strong>July 1, 2025:</strong> Initial Terms of Service published for 4track open source music platform.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legal-content {
  max-width: 900px;
  line-height: 1.8;
  color: var(--text-primary);
}

.intro-section {
  background: var(--bg-secondary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-2xl);
  border: 1px solid var(--border-primary);
}

.faq-section {
  background: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.faq-section ol {
  margin-bottom: 0;
  padding-left: 1.5rem;
}

.faq-section li {
  margin-bottom: var(--spacing-md);
}

.legal-content h2 {
  margin-top: 3rem;
  margin-bottom: 1.25rem;
  color: var(--color-primary);
  font-size: 1.75rem;
  font-weight: 700;
  padding-top: var(--spacing-lg);
  border-top: 3px solid var(--border-primary);
}

.legal-content h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
  font-size: 1.3rem;
  font-weight: 600;
}

.legal-content p {
  margin-bottom: 1.25rem;
}

.legal-content ul,
.legal-content ol {
  margin-bottom: 1.5rem;
  padding-left: 2rem;
}

.legal-content li {
  margin-bottom: 0.75rem;
  line-height: 1.7;
}

.legal-content ul ul {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.legal-content strong {
  color: var(--text-primary);
  font-weight: 700;
}

.legal-content a {
  color: var(--color-primary);
  text-decoration: underline;
}

.legal-content a:hover {
  color: var(--color-primary-hover);
}

.legal-content .card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-sm);
}

.legal-content .card.bg-tertiary {
  background: var(--bg-tertiary);
  border-color: var(--border-secondary);
}

.legal-content .card.bg-warning {
  background: rgba(255, 193, 7, 0.15);
  border-color: var(--color-warning);
}

.legal-content .text-uppercase {
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
  font-size: 0.95rem;
}

.legal-content .text-warning {
  color: var(--color-warning);
}

.legal-content .fw-bold {
  font-weight: 700 !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .intro-section {
    padding: var(--spacing-lg);
  }
  
  .faq-section {
    padding: var(--spacing-md);
  }
  
  .legal-content h2 {
    font-size: 1.5rem;
    padding-top: var(--spacing-md);
  }
  
  .legal-content h3 {
    font-size: 1.15rem;
  }
}
</style>